const Entry = require("./Entry");
const Redis = require("ioredis");

module.exports = class RedisCache {

    _name;
    _options;
    _connection = Redis.prototype;

    constructor(name, options) {
        this._name = name;
        this._options = options || {};
        this._options.redis ??= {};
        this._options.ttl ??= 600;
        this._options.loader ??= false;
        this._options.loadStrategy ??= "one";
        this._options.thisArg ??= false;
        this._options.preDestroy ??= async (key, value) => {
        };
        this._options.cacheLimit ??= -1;

        if (this._options.thisArg && this._options.loader) this._options.loader = this._options.loader.bind(this._options.thisArg);
        if (this._options.thisArg) this._options.preDestroy = this._options.preDestroy.bind(this._options.thisArg);

        this._connection = new Redis({keyPrefix: name + ":", ...this._options.redis});
    }

    async get(key, payload = undefined, loader = undefined) {
        if (typeof payload === "function" && typeof loader === "undefined") {
            loader = payload;
            payload = undefined;
        }
        let entry = await this._connection.get(`cache:${key}`);
        if (entry) {
            await this._connection.incr(`stats:hits`);
            return JSON.parse(entry).value;
        }

        await this._connection.incr(`stats:miss`);
        if (loader || this._options.loader) {
            let l = loader || this._options.loader;
            let loaderResult;
            if (this._options.loadStrategy === "multiple")
                loaderResult = (await l([key], payload))[0].value;
            else
                loaderResult = await l(key, payload);
            await this.set(key, loaderResult);
            return loaderResult;
        }

        return null;
    }

    async mGet(keys = [], payload = undefined) {
        let result = [];
        let missed = [];

        for (let key of keys) {
            let entry = await this._connection.get(`cache:${key}`);
            if (entry) {
                result.push({key, value: JSON.parse(entry).value});
                continue;
            }
            missed.push(key);
        }

        await this._connection.incrby(`stats:miss`, missed.length);
        await this._connection.incrby(`stats:hits`, result.length);

        if (this._options.loader) {
            if (this._options.loadStrategy === "multiple") {
                let datas = await this._options.loader(missed, payload);
                for (let data of datas) {
                    await this.set(data.key, data.value)
                    result.push(data);
                }
            } else {
                for (let missedElement of missed) {
                    let loaderResult = await this._options.loader(missedElement, payload);
                    await this.set(missedElement, loaderResult);
                    result.push({key: missedElement, value: loaderResult});
                }
            }
        } else {
            for (let missedElement of missed) {
                result.push({key: missedElement, value: null})
            }
        }

        return result;
    }

    async set(key, value, ttl = this._options.ttl) {
        let entry = await this._connection.get(`cache:${key}`);
        if (entry) {
            await this._options.preDestroy(key, JSON.parse(entry).value);
            await this._connection.del(`cache:${key}`);
        }
        await this._connection.set(`cache:${key}`, JSON.stringify({value:value}), "EX", ttl);
        let keys = await this._connection.keys(this._name+":cache:*");
        if (this._options.cacheLimit > 0 && keys.length > this._options.cacheLimit) {
            await this.delete(keys[0].substring(this._name.length + 1));
        }
    }

    async delete(key) {
        let entry = await this._connection.get(`cache:${key}`);
        if (entry) {
            await this._options.preDestroy(key, JSON.parse(entry).value);
            await this._connection.del(`cache:${key}`);
        }
    }

    has(key) {
        return this._connection.exists(`cache:${key}`);
    }

    async clear() {
        let keys = await this._connection.keys(this._name+":cache:*");
        for (let key of keys) {
            let entry = await this._connection.get(key.substring(this._name.length + 1));
            await this._options.preDestroy(key.substring(this._name.length + 1), entry);
        }
    }

    async stats() {
        return {
            keys: (await this._connection.keys(this._name + ":cache:*")).length,
            hits: await this._connection.get(`stats:hits`),
            miss: await this._connection.get(`stats:miss`)
        }
    }

    async resetStats() {
        await this._connection.set(`stats:hits`, 0);
        await this._connection.set(`stats:miss`, 0);
    }
}