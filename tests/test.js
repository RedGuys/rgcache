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
    }, cacheLimit: 2
});
(async () => {
    await aCache.set("a", "A");
    await aCache.set("b", "B");
    await aCache.set("c", "C");
    await aCache.set("d", "D");
})();
console.log(aCache)