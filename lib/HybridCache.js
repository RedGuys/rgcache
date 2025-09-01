const { MemoryCache } = require('./MemoryCache');
const { RedisCache } = require('./RedisCache');
const Redis = require('ioredis');

/**
 * Гибридный кэш: локальный in-memory + Redis, с опциональным pub/sub для инвалидирования
 */
class HybridCache {
  constructor(name, options = {}) {
    this._memory = new MemoryCache({
      thisArg: options.thisArg,
      ttl: options.ttl,
      loadStrategy: options.loadStrategy,
      preDestroy: options.preDestroy,
      cacheLimit: options.cacheLimit,
    });
    this._redis = new RedisCache(name,{
      thisArg: options.thisArg,
      redis: options.redis,
      ttl: options.ttl,
      loadStrategy: options.loadStrategy,
      preDestroy: options.preDestroy,
    });
    this._options = options;
    this._name = name;
    this._pubsubEnabled = !!options.pubsub;
    if (this._pubsubEnabled) {
      this._pub = new Redis(options.redis);
      this._sub = new Redis(options.redis);
      this._sub.subscribe(name + ':invalidate');
      this._sub.on('message', async (channel, message) => {
        if (channel === name + ':invalidate') {
          await this._memory.delete(message);
        }
      });
    }
  }

  async get(key, payload = undefined, loader = undefined) {
    let val = await this._memory.get(key);
    if (val !== null && val !== undefined) return val;

    val = await this._redis.get(key);
    if (val !== null && val !== undefined) {
      await this._memory.set(key, val);
      return val;
    }

    if (loader || this._options.loader) {
      const l = loader || this._options.loader;
      const result = await l(key, payload);
      await this._redis.set(key, result);
      await this._memory.set(key, result);
      return result;
    }
    return null;
  }

  async set(key, value, ttl) {
    await this._redis.set(key, value, ttl);
    await this._memory.set(key, value, ttl);
    if (this._pubsubEnabled) {
      await this._pub.publish(this._name + ':invalidate', key);
    }
  }

  async delete(key) {
    await this._redis.delete(key);
    await this._memory.delete(key);
    if (this._pubsubEnabled) {
      await this._pub.publish(this._name + ':invalidate', key);
    }
  }

  async clear() {
    await this._redis.clear();
    await this._memory.clear();
    if (this._pubsubEnabled) {
      await this._pub.publish(this._name + ':invalidate', '*');
    }
  }

  async has(key) {
    return (await this._memory.has(key)) || (await this._redis.has(key));
  }

  async mGet(keys = [], payload = undefined) {
    // Сначала пробуем локально, затем в Redis, затем loader
    let result = [];
    let missed = [];
    for (let key of keys) {
      let val = await this._memory.get(key);
      if (val !== null && val !== undefined) {
        result.push({key, value: val});
      } else {
        missed.push(key);
      }
    }
    if (missed.length > 0) {
      let redisResults = await this._redis.mGet(missed, payload);
      for (let r of redisResults) {
        if (r.value !== null && r.value !== undefined) {
          await this._memory.set(r.key, r.value);
        }
      }
      result = result.concat(redisResults);
    }
    return result;
  }

  async stats() {
    const memStats = this._memory.stats();
    const redisStats = await this._redis.stats();
    return {
      memory: memStats,
      redis: redisStats
    };
  }
}

module.exports.HybridCache = HybridCache;
