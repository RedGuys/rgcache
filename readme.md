# rgcache
Little caching module.
## Installing
```shell
npm install rgcache
```

```shell
yarn add rgcache
```

## Example
```js
let Cache = require('rgcache').Cache;
let aCache = new Cache({
    ttl: 600, loader: async (key) => {
        console.log("loader call");
        return key.toLowerCase();
    }
});

(async () => {
    console.log(await aCache.get("BAN"));
    await aCache.get("BAN");
    aCache.delete("BAN");
    await aCache.get("BAN");
    aCache.set("LOL", "lols");
    console.log(await aCache.get("LOL"))
    aCache.clear();
    console.log(await aCache.get("LOL"))
    console.log(aCache.stats());
})();```