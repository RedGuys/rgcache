function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let Cache = require('..').Cache;
let Crypto = require("crypto");
let aCache = new Cache({
    ttl: 1, loadStrategy:"one",
    loader: async (key="", payload) => {
        await sleep(10);
        return key.toLowerCase();
    }, preDestroy: (k,v) => {
        console.log("Destroying", k, v);
    }
});

aCache.set("b","a");
aCache.delete("b");
aCache.get("b")