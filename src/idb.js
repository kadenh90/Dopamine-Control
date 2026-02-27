const DB_NAME = "discipline_app";
const DB_VERSION = 1;

const STORES = {
  activities: "activities", 
  totals: "totals", 
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORES.activities)) {
        db.createObjectStore(STORES.activities, { keyPath: "key" });
      }

      if (!db.objectStoreNames.contains(STORES.totals)) {
        const totals = db.createObjectStore(STORES.totals, { keyPath: "id" });
        totals.createIndex("day", "day", { unique: false });
        totals.createIndex("activityKey", "activityKey", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**  Activities*/
export async function getAllActivities() {
  const db = await openDB();
  const tx = db.transaction(STORES.activities, "readonly");
  const store = tx.objectStore(STORES.activities);

  const req = store.getAll();
  const res = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return res;
}

export async function putActivity(activity) {
  const db = await openDB();
  const tx = db.transaction(STORES.activities, "readwrite");
  tx.objectStore(STORES.activities).put(activity);
  await txDone(tx);
  db.close();
}

export async function deleteActivity(key) {
  const db = await openDB();
  const tx = db.transaction(STORES.activities, "readwrite");
  tx.objectStore(STORES.activities).delete(key);
  await txDone(tx);
  db.close();
}

/* Totals (per day)*/
export async function getTotalsForDay(day) {
  const db = await openDB();
  const tx = db.transaction(STORES.totals, "readonly");
  const index = tx.objectStore(STORES.totals).index("day");

  const req = index.getAll(day);
  const rows = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const obj = {};
  for (const r of rows) obj[r.activityKey] = r.ms;

  db.close();
  return obj;
}

export async function setTotal(day, activityKey, ms) {
  const db = await openDB();
  const tx = db.transaction(STORES.totals, "readwrite");
  const id = `${day}|${activityKey}`;
  tx.objectStore(STORES.totals).put({ id, day, activityKey, ms });
  await txDone(tx);
  db.close();
}

export async function deleteTotalsForDay(day) {
  const db = await openDB();
  const tx = db.transaction(STORES.totals, "readwrite");
  const store = tx.objectStore(STORES.totals);
  const index = store.index("day");

  const req = index.getAllKeys(day);
  const keys = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  for (const k of keys) store.delete(k);

  await txDone(tx);
  db.close();
}

export async function deleteTotalsForActivity(activityKey) {
  const db = await openDB();
  const tx = db.transaction(STORES.totals, "readwrite");
  const store = tx.objectStore(STORES.totals);
  const index = store.index("activityKey");

  const req = index.getAllKeys(activityKey);
  const keys = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  for (const k of keys) store.delete(k);

  await txDone(tx);
  db.close();
}

/** seed defaults once */
export async function seedDefaultActivities(defaultActivities) {
  const existing = await getAllActivities();
  if (existing.length > 0) return;

  for (const a of defaultActivities) {
    await putActivity(a);
  }
}