export * from "./lib/HybridCache";
export * from "./lib/MemoryCache";
export * from "./lib/RedisCache";
export * from "./lib/RedisSyncedMemoryCache";

export type Stats = {
    /**
     * Number of keys stored in cache currently
     * @type {number}
     */
    keys: number,

    /**
     * Number of cache hits since cache initialization
     *
     * Note, RedisCache store this value on server and instance restart/recreation will NOT reset it
     * @type {number}
     */
    hits: number,

    /**
     * Number of cache misses since cache initialization
     *
     * Note, RedisCache store this value on server and instance restart/recreation will NOT reset it
     * @type {number}
     */
    miss: number
}

export type LoadStrategy = "one" | "multiple";

export type Loader<K, V, P = void> = ((key: K, payload?: P) => Promise<V>) | ((keys: K[], payload?: P) => Promise<V[]>);

export type PreDestroy<K, V> = (key: K, value: V, isDeleted?: boolean) => Promise<void> | void;

export type LimitableCapacity = {
    /**
     * Maximum number of keys to store in cache
     */
    cacheLimit?: number
}

export type CacheOptions<K, V, P = void> = {
    /**
     * Time to live in seconds for cache entries
     */
    ttl?: number,
    /**
     * Loader function to load a value if it is not in the cache
     * @param key - key to load
     * @param payload - payload to pass to loader
     * @returns - promise that resolves to value
     */
    loader?: Loader<K, V, P>
    /**
     * LoadStrategy to use when loading values
     */
    loadStrategy?: LoadStrategy,
    /**
     * this for loader and preDestroy to save your context
     */
    thisArg?: object,
    /**
     * Function to call before a value is removed from the cache
     * @param key - key of removed entry
     * @param value - value of removed entry
     */
    preDestroy?: PreDestroy<K, V>,
}