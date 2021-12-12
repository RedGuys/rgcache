let Cache = require('..').Cache;
let aCache = new Cache({
    ttl: 600, loadStrategy:"multiple",
    loader: async (key=[]) => {
        console.log("loader call:" + key.map(key => JSON.stringify(key)).join(", "));
        let res = {};
        for (let keyElement of key) {
            res[keyElement] = keyElement.toLowerCase();
        }
        return res;
    }
});

(async () => {
    console.log(await aCache.get("BAN"));
    await aCache.get("BAN");
    //aCache.delete({name:"BAN"});
    console.log(await aCache.get("LOL"));
    /*aCache.set("LOL", "lols");
    console.log(await aCache.get("LOL"))
    aCache.clear();
    console.log(await aCache.get("LOL"))*/
    console.log(aCache.stats());
})();