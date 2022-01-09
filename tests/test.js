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
    }
});

(async () => {
    let tasks = [];
    for (let i = 0; i < 100; i++) {
        tasks.push(await aCache.get(Crypto.randomUUID()));
    }
    console.log(aCache.stats())
})();