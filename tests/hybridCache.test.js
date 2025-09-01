const { HybridCache } = require('../lib/HybridCache');

describe('HybridCache', () => {
  let cache;
  beforeEach(() => {
    cache = new HybridCache('test', { redis: { host: 'localhost', port: 6379 } });
  });
  afterEach(async () => {
    await cache.clear();
  });

  test('returns null for missing key', async () => {
    expect(await cache.get('a')).toBeNull();
  });

  test('loader function populates both caches', async () => {
    const value = await cache.get('b', undefined, async (key) => key + 'b');
    expect(value).toBe('bb');
    // Должно быть и в памяти, и в редисе
    expect(await cache.get('b')).toBe('bb');
  });

  test('set and get value', async () => {
    await cache.set('d', 'val');
    expect(await cache.get('d')).toBe('val');
  });

  test('delete removes from both caches', async () => {
    await cache.set('e', 'exists');
    await cache.delete('e');
    expect(await cache.get('e')).toBeNull();
  });

  test('clear removes all values', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });

  test('TTL works (expires in both caches)', async () => {
    cache = new HybridCache('test', { redis: { host: 'localhost', port: 6379 }, ttl: 1 });
    await cache.set('ttlKey', 'ttlVal');
    expect(await cache.get('ttlKey')).toBe('ttlVal');
    await new Promise(res => setTimeout(res, 1100));
    expect(await cache.get('ttlKey')).toBeNull();
  });

  test('mGet returns correct results with partial misses', async () => {
    await cache.set('a', 1);
    const res = await cache.mGet(['a', 'b']);
    expect(res.find(x => x.key === 'a').value).toBe(1);
    expect(res.find(x => x.key === 'b').value).toBeNull();
  });

  test('pubsub invalidates local cache (if enabled)', async () => {
    const cacheA = new HybridCache('test', { redis: { host: 'localhost', port: 6379 }, pubsub: true });
    const cacheB = new HybridCache('test', { redis: { host: 'localhost', port: 6379 }, pubsub: true });
    await cacheA.set('x', 'y');
    expect(await cacheB.get('x')).toBe('y');
    await cacheA.delete('x');
    // Дождаться инвалидирования
    await new Promise(res => setTimeout(res, 100));
    expect(await cacheB.get('x')).toBeNull();
  });
});
