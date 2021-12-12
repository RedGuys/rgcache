module.exports = class Entry {
    _key;
    _value;
    _dead;

    constructor(key, value, dead) {
        this._key = key;
        this._value = value;
        this._dead = dead;
    }

    get key() {
        return this._key;
    }

    get value() {
        return this._value;
    }

    get dead() {
        return this._dead;
    }
}
