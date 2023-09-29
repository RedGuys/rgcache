function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let Cache = require('..').Cache;
let Crypto = require("crypto");
let aCache = new Cache({
    ttl: 1, loadStrategy:"one", preDestroy: (k,v) => {
        console.log("Destroying", k, v);
    }, cacheLimit: 2
});
(async () => {
    console.log(await aCache.get("a"));
    console.log(await aCache.get("b", async (key) => {return key + "b"}));
})();
console.log(aCache)