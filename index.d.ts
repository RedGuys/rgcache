import {RedisOptions} from "ioredis/built/redis/RedisOptions";

export class MemoryCache {
    /**
     * Constructs a new Cache instance
     * @param options {
     *     ttl: number - time to live in seconds
     *     loader: function - function to load a value if it is not in the cache
     *     loadStrategy: "one" | "multiple" - loadStrategy to use when loading values
     *     thisArg: any - thisArg to use when calling loader or preDestroy
     *     preDestroy: function - function to call before a value is removed from the cache
     * }
     */
    constructor(options?: MemoryCacheOptions);

    /**
     * Gets a value from the cache
     * @param key - key to get
     * @param payload - payload to pass to loader, if passed function and loader is not set, will use as loader
     * @param loader - loader to use if value is not in the cache
     */
    get(key: any, payload?: any, loader?: (any) => Object): Promise<any>;

    mGet(keys: any[], payload?: any): Promise<Object>;

    set(key: any, value: any, ttl?: number): Promise<void>;

    delete(key: any): Promise<void>;

    clear(): Promise<void>;

    stats(): { keys: number, hits: number, miss: number };

    has(key: any): boolean;
}

export type MemoryCacheOptions = {
    ttl?: number,
    loader?: (any) => Object,
    loadStrategy?: "one" | "multiple",
    thisArg?: any,
    preDestroy?: (key, value) => void,
    cacheLimit?: number
};

export class RedisCache {
    /**
     * Constructs a new Cache instance
     * @param name - name of the cache
     * @param options {
     *     ttl: number - time to live in seconds
     *     loader: function - function to load a value if it is not in the cache
     *     loadStrategy: "one" | "multiple" - loadStrategy to use when loading values
     *     thisArg: any - thisArg to use when calling loader or preDestroy
     *     preDestroy: function - function to call before a value is removed from the cache
     *     redis: RedisOptions - options to pass to ioredis
     * }
     */
    constructor(name:string, options?: RedisCacheOptions);

    /**
     * Gets a value from the cache
     * @param key - key to get
     * @param payload - payload to pass to loader, if passed function and loader is not set, will use as loader
     * @param loader - loader to use if value is not in the cache
     */
    get(key: any, payload?: any, loader?: (any) => Object): Promise<any>;

    mGet(keys: any[], payload?: any): Promise<Object>;

    set(key: any, value: any, ttl?: number): Promise<void>;

    delete(key: any): Promise<void>;

    clear(): Promise<void>;

    stats(): Promise<{ keys: number, hits: number, miss: number }>;

    has(key: any): boolean;

    resetStats(): Promise<void>;
}

export type RedisCacheOptions = {
    redis?: RedisOptions,
    ttl?: number,
    loader?: (any) => Object,
    loadStrategy?: "one" | "multiple",
    thisArg?: any,
    preDestroy?: (key, value) => void,
    cacheLimit?: number
}