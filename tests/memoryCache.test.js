const { MemoryCache } = require('..');

describe('MemoryCache', () => {
  let cache;
  beforeEach(() => {
    cache = new MemoryCache();
  });

  test('returns null for missing key', async () => {
    expect(await cache.get('a')).toBeNull();
  });

  test('loader function populates cache', async () => {
    const value = await cache.get('b', async (key) => key + 'b');
    expect(value).toBe('bb');
    expect(await cache.get('b')).toBe('bb');
  });

  test('deletes value', async () => {
    await cache.set('c', 'ccb');
    await cache.delete('c');
    expect(await cache.get('c')).toBeNull();
  });

  test('sets and gets value', async () => {
    await cache.set('d', 'val');
    expect(await cache.get('d')).toBe('val');
  });

  test('has returns correct status', async () => {
    await cache.set('e', 'exists');
    expect(cache.has('e')).toBe(true);
    await cache.delete('e');
    expect(cache.has('e')).toBe(false);
  });

  test('evicts expired values (TTL)', async () => {
    const cache = new MemoryCache({ ttl: 1 });
    await cache.set('ttlKey', 'ttlVal');
    expect(await cache.get('ttlKey')).toBe('ttlVal');
    await new Promise(res => setTimeout(res, 1100));
    expect(await cache.get('ttlKey')).toBeNull();
  });

  test('respects cacheLimit', async () => {
    const cache = new MemoryCache({ cacheLimit: 2 });
    await cache.set('k1', 'v1');
    await cache.set('k2', 'v2');
    await cache.set('k3', 'v3');
    const keys = ['k1', 'k2', 'k3'];
    const values = await Promise.all(keys.map(k => cache.get(k)));
    expect(values.filter(v => v !== null).length).toBe(2);
  });

  test('calls preDestroy on eviction', async () => {
    let destroyed = [];
    const cache = new MemoryCache({
      cacheLimit: 1,
      preDestroy: async (key, value) => destroyed.push([key, value])
    });
    await cache.set('a', 1);
    await cache.set('b', 2); // a должен быть удалён
    expect(destroyed.length).toBe(1);
    expect(destroyed[0][0]).toBe('a');
    expect(destroyed[0][1]).toBe(1);
  });

  test('loader error propagates', async () => {
    const cache = new MemoryCache();
    await expect(cache.get('fail', async () => { throw new Error('fail!'); })).rejects.toThrow('fail!');
  });

  test('thisArg is respected in loader and preDestroy', async () => {
    const context = { val: 42, destroyed: 0 };
    const cache = new MemoryCache({
      loader: function(key) { return this.val + key; },
      preDestroy: function() { this.destroyed++; },
      thisArg: context,
      cacheLimit: 1
    });
    expect(await cache.get(1)).toBe(43);
    await cache.set(2, 44); // вызовет preDestroy для 1
    expect(context.destroyed).toBe(1);
  });

  test('clear removes all values and resets stats', async () => {
    const cache = new MemoryCache();
    await cache.set('a', 1);
    await cache.set('b', 2);
    expect(await cache.get('a')).toBe(1);
    await cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
    expect(cache.stats().keys).toBe(0);
  });

  test('mGet returns correct results with partial misses', async () => {
    const cache = new MemoryCache();
    await cache.set('a', 1);
    const res = await cache.mGet(['a', 'b']);
    expect(res.find(x => x.key === 'a').value).toBe(1);
    expect(res.find(x => x.key === 'b').value).toBeNull();
  });

  test('handles null and undefined values', async () => {
    const cache = new MemoryCache();
    await cache.set('n', null);
    await cache.set('u', undefined);
    expect(await cache.get('n')).toBeNull();
    expect(await cache.get('u')).toBeUndefined();
  });
});
