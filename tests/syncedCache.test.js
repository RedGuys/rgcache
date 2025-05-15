const { RedisSyncedMemoryCache } = require('..');

describe('RedisSyncedMemoryCache', () => {
  let cacheA, cacheB;
  beforeEach(() => {
    cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 } });
    cacheB = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 } });
  });

  afterEach(async () => {
    await cacheA.clear();
    await cacheB.clear();
  });

  test('set and get value', async () => {
    await cacheA.set('A', 'BB');
    expect(await cacheA.get('A')).toBe('BB');
  });

  test('delete syncs between instances', async () => {
    await cacheA.set('A', 'BB');
    await cacheB.delete('A');
    // Подождём синхронизации
    await new Promise(res => setTimeout(res, 100));
    expect(await cacheA.get('A')).toBeNull();
  });

  test('has returns correct status', async () => {
    await cacheA.set('e', 'exists');
    expect(cacheA.has('e')).toBe(true);
    await cacheA.delete('e');
    expect(cacheA.has('e')).toBe(false);
  });

  test('evicts expired values (TTL)', async () => {
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 }, ttl: 1 });
    await cacheA.set('ttlKey', 'ttlVal');
    expect(await cacheA.get('ttlKey')).toBe('ttlVal');
    await new Promise(res => setTimeout(res, 1100));
    expect(await cacheA.get('ttlKey')).toBeNull();
  });

  test('respects cacheLimit', async () => {
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 }, cacheLimit: 2 });
    await cacheA.clear();
    await cacheA.set('k1', 'v1');
    await cacheA.set('k2', 'v2');
    await cacheA.set('k3', 'v3');
    const keys = ['k1', 'k2', 'k3'];
    const values = await Promise.all(keys.map(k => cacheA.get(k)));
    expect(values.filter(v => v !== null).length).toBe(2);
  });

  test('calls preDestroy on eviction', async () => {
    let destroyed = [];
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', {
      redis: { host: 'localhost', port: 6379 },
      cacheLimit: 1,
      preDestroy: async (key, value) => destroyed.push([key, value])
    });
    await cacheA.clear();
    await cacheA.set('a', 1);
    await cacheA.set('b', 2); // a должен быть удалён
    expect(destroyed.length).toBe(1);
    expect(destroyed[0][0]).toBe('a');
    expect(destroyed[0][1]).toBe(1);
  });

  test('loader error propagates', async () => {
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 } });
    await cacheA.clear();
    await expect(cacheA.get('fail', async () => { throw new Error('fail!'); })).rejects.toThrow('fail!');
  });

  test('thisArg is respected in loader and preDestroy', async () => {
    const context = { val: 42, destroyed: 0 };
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', {
      redis: { host: 'localhost', port: 6379 },
      loader: function(key) { return this.val + key; },
      preDestroy: function() { this.destroyed++; },
      thisArg: context,
      cacheLimit: 1
    });
    await cacheA.clear();
    expect(await cacheA.get(1)).toBe(43);
    await cacheA.set(2, 44); // вызовет preDestroy для 1
    expect(context.destroyed).toBe(1);
  });

  test('clear removes all values and resets stats', async () => {
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 } });
    await cacheA.set('a', 1);
    await cacheA.set('b', 2);
    expect(await cacheA.get('a')).toBe(1);
    await cacheA.clear();
    expect(await cacheA.get('a')).toBeNull();
    expect(await cacheA.get('b')).toBeNull();
    expect(cacheA.stats().keys).toBe(0);
  });

  test('mGet returns correct results with partial misses', async () => {
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 } });
    await cacheA.clear();
    await cacheA.set('a', 1);
    const res = await cacheA.mGet(['a', 'b']);
    expect(res.find(x => x.key === 'a').value).toBe(1);
    expect(res.find(x => x.key === 'b').value).toBeNull();
  });

  test('handles null and undefined values', async () => {
    const cacheA = new RedisSyncedMemoryCache('RedisSyncedMemoryCache', { redis: { host: 'localhost', port: 6379 } });
    await cacheA.clear();
    await cacheA.set('n', null);
    await cacheA.set('u', undefined);
    expect(await cacheA.get('n')).toBeNull();
    expect(await cacheA.get('u')).toBeUndefined();
  });
});
