/* offline-sync.js — Gerenciador de sincronização offline com IndexedDB */
'use strict';

/**
 * OfflineSync — fila persistente de operações pendentes.
 *
 * Comportamento:
 *  - Offline : operações são enfileiradas no IndexedDB
 *  - Online  : fila é processada e dados são enviados ao Supabase
 *
 * Estrutura de cada item na fila:
 *  { id, tipo, tabela, dados, timestamp, sincronizado }
 */
var OfflineSync = (function () {

  var DB_NAME    = 'renova_lotes_sync';
  var DB_VERSION = 1;
  var STORE_NAME = 'sync_queue';

  var _db             = null;
  var _supabaseClient = null;

  /* ------------------------------------------------------------------ */
  /* IndexedDB — abertura e upgrade                                       */
  /* ------------------------------------------------------------------ */
  function _openDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sincronizado', 'sincronizado', { unique: false });
          store.createIndex('tabela',       'tabela',       { unique: false });
        }
      };

      req.onsuccess = function (e) {
        _db = e.target.result;
        resolve(_db);
      };

      req.onerror = function (e) {
        reject(e.target.error);
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Gera ID único para cada item da fila                                */
  /* ------------------------------------------------------------------ */
  function _generateId() {
    return 'sync-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  }

  /* ------------------------------------------------------------------ */
  /* Enfileira uma operação                                               */
  /* ------------------------------------------------------------------ */
  function enqueue(tipo, tabela, dados) {
    if (!_db) return Promise.resolve(null);

    var item = {
      id           : _generateId(),
      tipo         : tipo,       /* 'create' | 'update' | 'delete' */
      tabela       : tabela,     /* 'clientes' | 'produtos' | 'vendas' | 'caixa' */
      dados        : dados,
      timestamp    : new Date().toISOString(),
      sincronizado : false
    };

    return new Promise(function (resolve, reject) {
      var tx    = _db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var req   = store.add(item);
      req.onsuccess = function ()    { resolve(item); };
      req.onerror   = function (e)   { reject(e.target.error); };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Retorna todos os itens não sincronizados                            */
  /* ------------------------------------------------------------------ */
  function _getPendingItems() {
    if (!_db) return Promise.resolve([]);

    return new Promise(function (resolve, reject) {
      var tx    = _db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var index = store.index('sincronizado');
      var req   = index.getAll(false);
      req.onsuccess = function (e) { resolve(e.target.result || []); };
      req.onerror   = function (e) { reject(e.target.error); };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Marca item como sincronizado                                        */
  /* ------------------------------------------------------------------ */
  function _markSynced(id) {
    if (!_db) return Promise.resolve();

    return new Promise(function (resolve, reject) {
      var tx    = _db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var get   = store.get(id);

      get.onsuccess = function (e) {
        var item = e.target.result;
        if (!item) { resolve(); return; }
        item.sincronizado = true;
        var put = store.put(item);
        put.onsuccess = function ()  { resolve(); };
        put.onerror   = function (ev) { reject(ev.target.error); };
      };

      get.onerror = function (e) { reject(e.target.error); };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Processa fila: envia itens pendentes ao Supabase                   */
  /* ------------------------------------------------------------------ */
  function processQueue() {
    if (!_supabaseClient || !navigator.onLine) return Promise.resolve();

    return _getPendingItems().then(function (items) {
      if (!items.length) return Promise.resolve();

      /* Agrupa por tabela */
      var byTable = {};
      items.forEach(function (item) {
        if (!byTable[item.tabela]) byTable[item.tabela] = [];
        byTable[item.tabela].push(item);
      });

      var promises = Object.keys(byTable).map(function (tabela) {
        var tableItems  = byTable[tabela];
        var upsertItems = tableItems.filter(function (i) { return i.tipo !== 'delete'; });
        var deleteItems = tableItems.filter(function (i) { return i.tipo === 'delete'; });

        var ops = [];
        var ts  = new Date().toISOString();

        if (upsertItems.length) {
          var rows = upsertItems.map(function (i) {
            return Object.assign({}, i.dados, { data_sincronizacao: ts });
          });

          ops.push(
            _supabaseClient
              .from(tabela)
              .upsert(rows, { onConflict: 'id' })
              .then(function (result) {
                if (result.error) throw result.error;
                return Promise.all(upsertItems.map(function (i) { return _markSynced(i.id); }));
              })
              .catch(function (err) {
                console.warn('[OfflineSync] Upsert falhou para', tabela, ':', err.message || err);
              })
          );
        }

        if (deleteItems.length) {
          var delOps = deleteItems.map(function (item) {
            return _supabaseClient
              .from(tabela)
              .delete()
              .eq('id', item.dados.id)
              .then(function (result) {
                if (result.error) throw result.error;
                return _markSynced(item.id);
              })
              .catch(function (err) {
                console.warn('[OfflineSync] Delete falhou para', tabela, ':', err.message || err);
              });
          });
          ops.push(Promise.all(delOps));
        }

        return Promise.all(ops);
      });

      return Promise.all(promises).then(function () {
        console.log('[OfflineSync] Fila processada —', items.length, 'operações enviadas.');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Retorna número de itens pendentes                                   */
  /* ------------------------------------------------------------------ */
  function getPendingCount() {
    return _getPendingItems().then(function (items) { return items.length; });
  }

  /* ------------------------------------------------------------------ */
  /* Inicializa o módulo                                                 */
  /* ------------------------------------------------------------------ */
  var _initialized = false;

  function init(client) {
    /* Atualiza cliente se fornecido (pode ser chamado novamente com credenciais) */
    if (client) _supabaseClient = client;

    /* Evita registrar listeners duplicados */
    if (_initialized) {
      if (navigator.onLine && _supabaseClient) {
        processQueue().catch(function (err) {
          console.warn('[OfflineSync] Erro ao processar fila:', err);
        });
      }
      return Promise.resolve();
    }
    _initialized = true;

    return _openDB()
      .then(function () {
        /* Processa fila quando a conexão for restaurada */
        window.addEventListener('online', function () {
          console.log('[OfflineSync] Conexão restaurada — processando fila...');
          processQueue().catch(function (err) {
            console.warn('[OfflineSync] Erro ao processar fila:', err);
          });
        });

        /* Processa fila imediatamente se já estiver online */
        if (navigator.onLine && _supabaseClient) {
          processQueue().catch(function (err) {
            console.warn('[OfflineSync] Erro ao processar fila inicial:', err);
          });
        }

        /* Escuta mensagens do Service Worker (Background Sync) */
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener('message', function (e) {
            if (e.data && e.data.type === 'PROCESS_SYNC_QUEUE') {
              processQueue().catch(function (err) {
                console.warn('[OfflineSync] Erro ao processar fila (SW):', err);
              });
            }
          });
        }

        console.log('[OfflineSync] IndexedDB inicializado. DB:', DB_NAME);
      })
      .catch(function (err) {
        console.warn('[OfflineSync] Erro ao abrir IndexedDB:', err);
      });
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    init            : init,
    enqueue         : enqueue,
    processQueue    : processQueue,
    getPendingCount : getPendingCount
  };

}());
