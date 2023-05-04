const Entry = require("./Entry");

module.exports = class Cache {

    _stats = {hits: 0, miss: 0};
    _options;

    _data = [];

    constructor(options) {
        this._options = options || {};
        if (!this._options.ttl) this._options.ttl = 600;
        if (!this._options.loader) this._options.loader = false;
        if (!this._options.loadStrategy) this._options.loadStrategy = "one";
        if (!this._options.thisArg) this._options.thisArg = false;
        if (!this._options.preDestroy) this._options.preDestroy = async (key, value) => {};

        if (this._options.thisArg && this._options.loader) this._options.loader = this._options.loader.bind(this._options.thisArg);
        if (this._options.thisArg) this._options.preDestroy = this._options.preDestroy.bind(this._options.thisArg);
    }

    async get(key, payload = undefined) {
        let entry = this._data.find(e => this._deepEqual(e.key, key));
        if (entry) {
            if ((Date.now() / 1000) > entry.dead) {
                await this.delete(key);
            } else {
                this._stats.hits++;
                return entry.value;
            }
        }

        this._stats.miss++;
        if (this._options.loader) {
            let loaderResult;
            if (this._options.loadStrategy === "multiple")
                loaderResult = (await this._options.loader([key], payload))[0].value;
            else
                loaderResult = await this._options.loader(key, payload);
            await this.set(key, loaderResult);
            await this._clearOld();
            this._clearDuplicates();
            return loaderResult;
        }

        return null;
    }

    async mGet(keys = [], payload = undefined) {
        let result = [];
        let missed = [];

        for (let key of keys) {
            let entry = this._data.find(e => this._deepEqual(e.key, key));
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
                    result.push({key:missedElement,value:loaderResult});
                }
            }
        } else {
            for (let missedElement of missed) {
                result.push({key:missedElement,value:null})
            }
        }

        await this._clearOld();
        this._clearDuplicates();

        return result;
    }

    async set(key, value, ttl = this._options.ttl) {
        let entry = this._data.find(e => e.key === key);
        if (entry) {
            await this._options.preDestroy(key, entry.value);
            this._data.splice(this._data.indexOf(entry), 1);
        }
        this._data.push(new Entry(key, value, (Date.now() / 1000) + ttl))
    }

    async delete(key) {
        let entry = this._data.find(e => e.key === key);
        if (entry) {
            await this._options.preDestroy(key, entry.value);
            this._data.splice(this._data.indexOf(entry), 1);
        }
    }

    async clear() {
        for (let entry of this._data) {
            await this._options.preDestroy(entry.key, entry.value);
        }
        delete this._data;
        this._data = [];
    }

    stats() {
        return Object.assign({}, this._stats, {keys: Object.keys(this._data).length});
    }

    _deepEqual(x, y) {
        const ok = Object.keys, tx = typeof x, ty = typeof y;
        return x && y && tx === 'object' && tx === ty ? (
            ok(x).length === ok(y).length &&
            ok(x).every(key => this._deepEqual(x[key], y[key]))
        ) : (x === y);
    }

    async _clearOld() {
        let now = Date.now() / 1000;
        let toRemove = this._data.filter(value => value.dead < now);
        for (let entry of toRemove) {
            await this._options.preDestroy(entry.key, entry.value);
        }
        this._data = this._data.filter(value => value.dead > now);
    }

    _clearDuplicates() {
        let newData = this._data.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.key === value.key
            ))
        )
        this._data = newData;
    }
}