const { Entry } = require("./Entry");

module.exports.MemoryCache = class MemoryCache {

    /**
     *
     * @type {{hits: number, miss: number}}
     * @private
     */
    _stats = {hits: 0, miss: 0};
    _options;
    /**
     *
     * @type {Map<any, any>}
     * @private
     */
    _data = new Map();

    constructor(options) {
        this._options = options || {};
        if (!this._options.ttl) this._options.ttl = 600;
        if (!this._options.loader) this._options.loader = false;
        if (!this._options.loadStrategy) this._options.loadStrategy = "one";
        if (!this._options.thisArg) this._options.thisArg = false;
        if (!this._options.preDestroy) this._options.preDestroy = async () => {
        };
        if (!this._options.cacheLimit) this._options.cacheLimit = -1;

        if (this._options.thisArg && this._options.loader) this._options.loader = this._options.loader.bind(this._options.thisArg);
        if (this._options.thisArg) this._options.preDestroy = this._options.preDestroy.bind(this._options.thisArg);
    }

    async get(key, payload = undefined, loader = undefined) {
        if (typeof payload === "function" && typeof loader === "undefined") {
            loader = payload;
            payload = undefined;
        }
        let entry = this._data.get(key);
        if (entry) {
            if ((Date.now() / 1000) > entry.dead) {
                await this.delete(key);
            } else {
                this._stats.hits++;
                return entry.value;
            }
        }

        this._stats.miss++;
        if (loader || this._options.loader) {
            let l = loader || this._options.loader;
            let loaderResult;
            if (this._options.loadStrategy === "multiple")
                loaderResult = (await l([key], payload))[0].value;
            else
                loaderResult = await l(key, payload);
            await this.set(key, loaderResult);
            await this._clearOld();
            return loaderResult;
        }

        return null;
    }

    async mGet(keys = [], payload = undefined) {
        let result = [];
        let missed = [];

        for (let key of keys) {
            let entry = this._data.get(key);
            if (entry) {
                if ((Date.now() / 1000) > entry.dead) {
                    await this.delete(key);
                } else {
                    this._stats.hits++;
                    result.push({key, value: entry.value});
                    continue;
                }
            }
            missed.push(key);
        }

        this._stats.miss += missed.length;

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

        await this._clearOld();

        return result;
    }

    async set(key, value, ttl = this._options.ttl) {
        let entry = this._data.get(key);
        if (entry) {
            await this._options.preDestroy(key, entry.value, false);
        }
        this._data.set(key, new Entry(key, value, (Date.now() / 1000) + ttl));
        await this._handleOverload();
    }

    async delete(key) {
        let entry = this._data.get(key);
        if (entry) {
            await this._options.preDestroy(key, entry.value, true);
            this._data.delete(key);
        }
    }

    has(key) {
        return this._data.has(key);
    }

    async clear() {
        for (let entry of this._data.entries()) {
            await this._options.preDestroy(entry[0], entry[1].value, true);
        }
        delete this._data;
        this._data = new Map();
    }

    stats() {
        return Object.assign({}, this._stats, {keys: this._data.size});
    }

    async _clearOld() {
        let now = Date.now() / 1000;
        for (let [key, entry] of this._data) {
            if (entry.dead < now) {
                await this._options.preDestroy(key, entry.value, false);
                this._data.delete(key);
            }
        }
    }

    async _handleOverload() {
        if (this._options.cacheLimit > 0 && this._data.size > this._options.cacheLimit) {
            let entry = this._data.entries().next().value;
            await this._options.preDestroy(entry[0], entry[1].value, false);
            this._data.delete(entry[0]);
        }
    }
}