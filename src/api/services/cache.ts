import { StructuredLogger } from './logger';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

class InMemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    
    //  Clean Cache
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(key: string, value: any, ttl: number = 3600): void {
    //  Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiry });
    
    StructuredLogger.logDebug('Cache Set', { key, ttl });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      StructuredLogger.logDebug('Cache Miss', { key });
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      StructuredLogger.logDebug('Cache Expired', { key });
      return null;
    }

    StructuredLogger.logDebug('Cache Hit', { key });
    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      StructuredLogger.logDebug('Cache Cleanup', { cleanedCount });
    }
  }
}

export const cache = new InMemoryCache({ maxSize: 1000 });

//  Cache Decorator
export function cached(ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const argsString = JSON.stringify(args, (key, value) => {
        return value === undefined ? null : value;
      });
      
      const className = target.constructor.name || 'Unknown';
      const cacheKey = `${className}:${propertyName}:${argsString}`;
      
      let result = cache.get(cacheKey);
      if (result !== null) {
        return result;
      }

      result = await method.apply(this, args);
      if (result !== undefined) {
        cache.set(cacheKey, result, ttl);
      }
      
      return result;
    };
  };
}