export class Cache {
    constructor(options: { ttl?: number, loader?: (any) => Object, loadStrategy?: "one" | "multiple", thisArg: any});

    get(key: any, payload?: any): Promise<any>;

    mGet(keys: any[], payload?: any): Promise<Object>

    set(key: any, value: any, ttl?: number);

    delete(key: any);

    clear();

    stats(): { keys: number, hits: number, miss: number };
}