const cacheStore = new Map();

export const setCache = (key, value, ttl = 45000) => {
  const expiresAt = Date.now() + ttl;
  cacheStore.set(key, { value, expiresAt });

  setTimeout(() => {
    const entry = cacheStore.get(key);
    if (entry && entry.expiresAt <= Date.now()) {
      cacheStore.delete(key);
    }
  }, ttl + 50);
};

export const getCache = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
};

export const deleteCache = (key) => cacheStore.delete(key);

export const clearCache = () => cacheStore.clear();
