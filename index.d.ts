export class Cache {
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
    constructor(options: { ttl?: number, loader?: (any) => Object, loadStrategy?: "one" | "multiple", thisArg: any, preDestroy: (key, value) => void, cacheLimit?: number});

    get(key: any, payload?: any): Promise<any>;

    mGet(keys: any[], payload?: any): Promise<Object>;

    set(key: any, value: any, ttl?: number): Promise<void>;

    delete(key: any): Promise<void>;

    clear(): Promise<void>;

    stats(): { keys: number, hits: number, miss: number };
}