export class Cache {
    constructor(options: { ttl?: number, loader?: (any) => Object, loadStrategy?:"one"|"multiple" });

    get(key: any): Promise<any>;

    mGet(keys: any[]): Promise<Object>

    set(key: any, value: any, ttl?: number);

    delete(key: any);

    clear();

    stats(): { keys: number, hits: number, miss: number };
}