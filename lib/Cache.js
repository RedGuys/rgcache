const Entry = require("./Entry");
const assert = require("assert");

module.exports = class Cache {

    _stats = {hits: 0, miss: 0};
    _options;

    _data = [];

    constructor(options) {
        this._options = options || {};
        if (!this._options.ttl) this._options.ttl = 600;
        if (!this._options.loader) this._options.loader = false;
        if (!this._options.loadStrategy) this._options.loadStrategy = "one";
    }

    async get(key) {
        let entry = this._data.find(e => this._deepEqual(e.key,key));
        if (entry) {
            if((Date.now()/1000)>entry.dead) {
                this.delete(key);
            } else {
                this._stats.hits++;
                return entry.value;
            }
        }

        this._stats.miss++;
        if (this._options.loader) {
            let loaderResult;
            if(this._options.loadStrategy === "multiple")
                loaderResult = (await this._options.loader([key]))[key];
            else
                loaderResult = await this._options.loader(key);
            this.set(key,loaderResult);
            return loaderResult;
        }

        return null;
    }

    async mGet(keys = []) {
        let result = {};
        let missed = [];

        for (let key of keys) {
            let entry = this._data.find(e => this._deepEqual(e.key, key));
            if (entry) {
                if((Date.now()/1000)>entry.dead) {
                    this.delete(key);
                } else {
                    this._stats.hits++;
                    return entry.value;
                }
            } else {
                missed.push(key);
            }
        }

        this._stats.miss+=missed.length;

        if(this._options.loader) {
            if(this._options.loadStrategy === "multiple") {
                let data = await this._options.loader(missed);
                for (let dataKey in data) {
                    if (data.hasOwnProperty(dataKey)) {
                        this.set(dataKey,data[dataKey])
                        result[dataKey] = data[dataKey];
                    }
                }
            } else {
                for (let missedElement of missed) {
                    let loaderResult = await this._options.loader(missedElement);
                    this.set(missedElement,loaderResult);
                    result[missedElement] = loaderResult;
                }
            }
        } else {
            for (let missedElement of missed) {
                result[missedElement] = null;
            }
        }

        return result;
    }

    set(key, value, ttl = this._options.ttl) {
        let entry = this._data.find(e => e.key === key);
        if(entry) {
            this._data.slice(this._data.indexOf(entry),1);
        }
        this._data.push(new Entry(key,value,(Date.now() / 1000) + ttl))
    }

    delete(key) {
        let entry = this._data.find(e => e.key === key);
        if(entry) {
            this._data.slice(this._data.indexOf(entry),1);
        }
    }

    clear() {
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
}