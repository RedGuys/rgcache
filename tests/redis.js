const Redis = require("..").RedisCache;

let cache = new Redis("test", {redis: {host: "localhost", port: 6379}});

(async () => {
    test(await cache.get("a") === null, "Empty value check");
    test(await cache.get("b", async (key) => {return key + "b"}) === "bb", "Loader function check");
    test(await cache.get("b") === "bb", "Getting value check");
    await cache.delete("b");
    test(await cache.get("b") === null, "Deleting value check");
    await cache.set("c", "ccb");
    test(await cache.get("c") === "ccb", "Setting value check");
    console.log(await cache.stats());
    await cache.resetStats();
    console.log(await cache.stats());
    await cache.set("aaa", {"g": "g", "h": "gh"});
    console.log(typeof await cache.get("aaa"));
    console.log(await cache.get("aaa"));
})();

function test(assertion, message) {
    if(assertion) {
        console.log("✅  " + message);
    } else {
        console.log("❌  " + message);
    }
}
