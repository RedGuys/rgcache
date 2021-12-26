function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let Cache = require('..').Cache;
let aCache = new Cache({
    ttl: 600, loadStrategy:"one",
    loader: async (key="", payload) => {
        await sleep(5000);
        return key.toLowerCase();
    }
});

(async () => {
    let tasks = [];
    for (let i = 0; i < 5000; i++) {
        tasks.push(aCache.get("BBB"))
    }
    await Promise.all(tasks);
    console.log(aCache.stats())
})();