import {CacheOptions, LimitableCapacity, Loader, Stats} from "../index";

export class MemoryCache<K, V, P> {
    /**
     * Constructs a new Cache instance
     * @param options - cache options
     */
    constructor(options?: MemoryCacheOptions<K, V, P>);

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
     * Clears all values from cache
     */
    clear(): Promise<void>;

    /**
     * Gets stats of cache
     */
    stats(): Stats;

    /**
     * Checks if key exists in cache
     * @param key
     */
    has(key: K): boolean;
}

export type MemoryCacheOptions<K, V, P> = CacheOptions<K, V, P> & LimitableCapacity;