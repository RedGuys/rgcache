const Redis = require("..").RedisSyncedMemoryCache;

let cacheA = new Redis("test", {redis: {host: "localhost", port: 6379}});
let cacheB = new Redis("test", {redis: {host: "localhost", port: 6379}});

(async () => {
    await cacheA.set("A", "BB");
    test(await cacheA.get("A") === "BB", "Set check");
    await cacheB.set("A", "CC");
    await cacheB.delete("A");
    test(await cacheA.get("A") === null, "Delete check");
})();

function test(assertion, message) {
    if(assertion) {
        console.log("✅  " + message);
    } else {
        console.log("❌  " + message);
    }
}