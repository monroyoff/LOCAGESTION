import fs from 'fs';
import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const TMP_DATA_DIR = path.join('/tmp', 'locagestion_data');

// Global in-memory store across warm serverless invocations & daemon requests
const memoryStore: Record<string, any> =
  (globalThis as any)._locagestion_store ||
  ((globalThis as any)._locagestion_store = {});

function readRawJsonFromPath(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {}
  return undefined;
}

/**
 * Lit une collection tableau (ex: users.json, leases.json, listings.json...)
 * en fusionnant de manière déterministe la base embarquée (data/), le stockage /tmp et la mémoire vive.
 */
export function readJsonFile<T extends any[]>(
  filename: string,
  fallback: T,
  idField: string = 'id'
): T {
  const storeKey = filename.replace('.json', '');

  if (memoryStore[storeKey] && Array.isArray(memoryStore[storeKey]) && memoryStore[storeKey].length > 0) {
    return memoryStore[storeKey] as T;
  }

  const staticData = readRawJsonFromPath(path.join(DATA_DIR, filename));
  const tmpData = readRawJsonFromPath(path.join(TMP_DATA_DIR, filename));

  const staticArr: any[] = Array.isArray(staticData) ? staticData : [];
  const tmpArr: any[] = Array.isArray(tmpData) ? tmpData : [];

  if (staticArr.length === 0 && tmpArr.length === 0) {
    memoryStore[storeKey] = fallback;
    return fallback;
  }

  // Fusionner staticArr (base) et tmpArr (ajouts/mises à jour runtime)
  const mergedMap = new Map<string, any>();
  const getKey = (item: any, idx: number): string => {
    if (!item || typeof item !== 'object') return String(item ?? idx);
    if (filename === 'users.json' && item.email) {
      return String(item.email).trim().toLowerCase();
    }
    if (item[idField]) return String(item[idField]).trim();
    if (item.id) return String(item.id).trim();
    if (item.email) return String(item.email).trim().toLowerCase();
    return `idx-${idx}`;
  };

  staticArr.forEach((item, idx) => {
    mergedMap.set(getKey(item, idx), item);
  });

  tmpArr.forEach((item, idx) => {
    const key = getKey(item, idx);
    const existing = mergedMap.get(key);
    if (existing && typeof existing === 'object' && typeof item === 'object') {
      mergedMap.set(key, { ...existing, ...item });
    } else {
      mergedMap.set(key, item);
    }
  });

  const merged = Array.from(mergedMap.values()) as T;
  memoryStore[storeKey] = merged;
  return merged;
}

/**
 * Lit un objet JSON clé-valeur (ex: admin.json, reset_codes.json, inspections.json)
 */
export function readJsonObject<T extends Record<string, any>>(
  filename: string,
  fallback: T
): T {
  const storeKey = `obj_${filename.replace('.json', '')}`;

  if (memoryStore[storeKey] && typeof memoryStore[storeKey] === 'object') {
    return memoryStore[storeKey] as T;
  }

  const staticObj = readRawJsonFromPath(path.join(DATA_DIR, filename));
  const tmpObj = readRawJsonFromPath(path.join(TMP_DATA_DIR, filename));

  const merged: T = {
    ...fallback,
    ...(staticObj && typeof staticObj === 'object' && !Array.isArray(staticObj) ? staticObj : {}),
    ...(tmpObj && typeof tmpObj === 'object' && !Array.isArray(tmpObj) ? tmpObj : {}),
  };

  memoryStore[storeKey] = merged;
  return merged;
}

/**
 * Écrit une collection tableau de manière synchrone en mémoire vive, dans /tmp et dans data/
 */
export function writeJsonFile<T>(filename: string, data: T): void {
  const storeKey = filename.replace('.json', '');
  memoryStore[storeKey] = data;

  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(TMP_DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

/**
 * Écrit un objet JSON clé-valeur en mémoire vive, dans /tmp et dans data/
 */
export function writeJsonObject<T extends Record<string, any>>(filename: string, data: T): void {
  const storeKey = `obj_${filename.replace('.json', '')}`;
  memoryStore[storeKey] = data;

  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(TMP_DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}
