import {CacheOptions, LimitableCapacity, Loader, Stats} from '../index';
import {RedisOptions} from "ioredis/built/redis/RedisOptions";

/**
 * Опции для HybridCache
 * @template K - тип ключа
 * @template V - тип значения
 * @template P - тип payload
 * @property pubsub - включает pub/sub-синхронизацию между инстанциями
 * @property redis - параметры подключения к Redis
 */
export interface HybridCacheOptions<K, V, P> extends CacheOptions<K, V, P>, LimitableCapacity {
  /**
   * Включить pub/sub для активной синхронизации между инстанциями
   */
  pubsub?: boolean;
  /**
   * Параметры подключения к Redis (host, port и т.д.)
   */
  redis?: RedisOptions;
}

/**
 * Гибридный кэш: локальный in-memory + Redis, с опциональным pub/sub для инвалидирования
 *
 * 1. Поиск сначала в памяти, затем в Redis, затем loader
 * 2. set/delete/clear отражаются и в памяти, и в Redis
 * 3. pub/sub (если включён) инвалидирует локальный кэш на всех инстанциях
 *
 * @template K - тип ключа
 * @template V - тип значения
 * @template P - тип payload
 */
export class HybridCache<K, V, P> {
  /**
   * @param name - имя кэша (используется как префикс в Redis)
   * @param options - опции кэша (ttl, loader, pubsub и др.)
   */
  constructor(name: string, options?: HybridCacheOptions<K, V, P>);

  /**
   * Получить значение по ключу
   * @param key - ключ
   * @param payload - дополнительный payload для loader
   * @param loader - кастомный loader (переопределяет глобальный)
   * @returns значение или null
   */
  get(key: K, payload?: P, loader?: Loader<K, V, P>): Promise<V>;

  /**
   * Установить значение
   * @param key - ключ
   * @param value - значение
   * @param ttl - время жизни (сек)
   */
  set(key: K, value: V, ttl?: number): Promise<void>;

  /**
   * Удалить значение по ключу
   * @param key - ключ
   */
  delete(key: K): Promise<void>;

  /**
   * Очистить кэш полностью
   */
  clear(): Promise<void>;

  /**
   * Проверить наличие ключа
   * @param key - ключ
   */
  has(key: K): Promise<boolean>;

  /**
   * Массовое получение значений
   * @param keys - массив ключей
   * @param payload - дополнительный payload для loader
   * @returns массив объектов {key, value}
   */
  mGet(keys: K[], payload?: P): Promise<{key: K, value: V}[]>;

  /**
   * Получить статистику по кэшу (memory + redis)
   */
  stats(): Promise<{memory: Stats, redis: Stats}>;
}
