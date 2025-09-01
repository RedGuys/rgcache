module.exports = {
    MemoryCache: require("./MemoryCache").MemoryCache,
    RedisCache: require("./RedisCache").RedisCache,
    Entry: require("./Entry").Entry,
    RedisSyncedMemoryCache: require("./RedisSyncedMemoryCache").RedisSyncedMemoryCache,
    HybridCache: require("./HybridCache").HybridCache
}