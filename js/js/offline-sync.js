/* offline-sync.js — Sincronização offline com IndexedDB */
'use strict';

const OfflineSync = (function() {
  const DB_NAME = 'RenovaLotesDB';
  const QUEUE_STORE = 'syncQueue';
  let db = null;

  function init(client) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        console.log('✅ IndexedDB inicializado');
        resolve(db);
      };
      
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(QUEUE_STORE)) {
          database.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  function enqueue(tipo, tabela, dados) {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error('DB não inicializado'));
      
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const item = {
        tipo,
        tabela,
        dados,
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      const req = store.add(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  function getPendingCount() {
    return new Promise((resolve, reject) => {
      if (!db) return resolve(0);
      
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.count();
      
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function processQueue() {
    return getPendingCount().then(count => {
      console.log(`📤 Processando ${count} itens da fila...`);
      // Implementação será continuada no sync-cloud.js
      return count;
    });
  }

  return {
    init,
    enqueue,
    getPendingCount,
    processQueue
  };
})();
