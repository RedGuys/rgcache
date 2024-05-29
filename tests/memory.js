const Redis = require("..").MemoryCache;

let cache = new Redis({});

(async () => {
    test(await cache.get("a") === null, "Empty value check");
    test(await cache.get("b", async (key) => {return key + "b"}) === "bb", "Loader function check");
    test(await cache.get("b") === "bb", "Getting value check");
    await cache.delete("b");
    test(await cache.get("b") === null, "Deleting value check");
    await cache.set("c", "ccb");
    test(await cache.get("c") === "ccb", "Setting value check");
})();

function test(assertion, message) {
    if(assertion) {
        console.log("✅  " + message);
    } else {
        console.log("❌  " + message);
    }
}