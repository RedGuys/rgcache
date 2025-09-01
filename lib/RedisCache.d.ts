import {Stats, CacheOptions, Loader} from "../index";
import {RedisOptions} from "ioredis/built/redis/RedisOptions";

export class RedisCache<K, V, P> {
    /**
     * Constructs a new RedisCache instance
     * @param name - name of the cache
     * @param options - options for cache
     */
    constructor(name: string, options?: RedisCacheOptions<K, V, P>);

    /**
     * Gets a value from the cache
     * @param key - key to get
     * @param payload - payload to pass to loader, if passed function and loader is not set, will use as loader
     * @param loader - loader to use if value is not in the cache (overrides loader in options)
     */
    get(key: K, payload?: P, loader?: Loader<K, V, P>): Promise<V>;

    /**
     * Gets array of values from the cache
     * @param keys - keys to get
     * @param payload - payload to pass to loader
     */
    mGet(keys: K[], payload?: P): Promise<V[]>;

    /**
     * Sets value in cache
     * @param key - key to set
     * @param value - value to set
     * @param ttl - time to live in seconds (overrides ttl in options)
     */
    set(key: K, value: V, ttl?: number): Promise<void>;

    /**
     * Deletes value from cache
     * @param key - key to delete
     */
    delete(key: K): Promise<void>;

    /**
     * Deletes all values from cache
     */
    clear(): Promise<void>;

    /**
     * Gets stats from cache
     */
    stats(): Promise<Stats>;

    /**
     * Checks if key exists in cache
     * @param key - key to check
     */
    has(key: K): Promise<boolean>;

    /**
     * Resets stats from cache in redis, will affect all instances
     */
    resetStats(): Promise<void>;
}

export type RedisCacheOptions<K, V, P> = CacheOptions<K, V, P> & {
    /**
     * Parameters to pass to ioredis, configures the connection to redis
     */
    redis?: RedisOptions,
}