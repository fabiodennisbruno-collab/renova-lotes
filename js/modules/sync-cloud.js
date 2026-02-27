/* sync-cloud.js — Sincronização bidirecional localStorage ↔ Supabase */
'use strict';

/**
 * SyncCloud — módulo de sincronização offline-first.
 *
 * Comportamento:
 *  - Offline : app funciona normalmente com localStorage (sem alterações)
 *  - Online  : gravações no localStorage são espelhadas no Supabase (push)
 *              e na abertura da página os dados mais recentes são puxados (pull)
 *
 * Tabelas sincronizadas:
 *  products (renova_lotes_html_v6), configs (renova_lotes_html_v6_config)
 */
var SyncCloud = (function () {

  /* Mapa chave localStorage → tabela Supabase */
  var SYNC_MAP = {
    'renova_lotes_html_v6':        'products',
    'renova_lotes_html_v6_config': 'configs'
  };

  /* Chaves que armazenam um objeto JSON (não array) e precisam de tratamento especial */
  var OBJECT_KEYS = {
    'renova_lotes_html_v6_config': true
  };

  var _client      = null;
  var _active      = false;
  var _origSetItem = null;   /* referência ao Storage.prototype.setItem original */

  /* ------------------------------------------------------------------ */
  /* Inicialização                                                        */
  /* ------------------------------------------------------------------ */
  function init(client) {
    if (!client) {
      console.info('[SyncCloud] Supabase não configurado — modo localStorage ativo.');
      return;
    }

    _client = client;
    _active = true;

    _interceptLocalStorage();
    _pullAll();

    /* Re-sincroniza quando a conexão é restaurada */
    window.addEventListener('online', function () {
      console.log('[SyncCloud] Conexão restaurada — sincronizando dados...');
      _pullAll();
    });

    /* Re-push quando outra aba grava no localStorage (cross-tab) */
    window.addEventListener('storage', function (e) {
      if (_active && e.key && SYNC_MAP[e.key] && e.newValue) {
        _pushToCloud(e.key, e.newValue).catch(function (err) {
          console.warn('[SyncCloud] Erro cross-tab push', e.key, ':', err.message || err);
        });
      }
    });

    console.log('[SyncCloud] Sincronização ativada para as tabelas:', Object.keys(SYNC_MAP).join(', '));
  }

  /* ------------------------------------------------------------------ */
  /* Intercepta localStorage.setItem                                      */
  /* ------------------------------------------------------------------ */
  function _interceptLocalStorage() {
    _origSetItem = Storage.prototype.setItem;

    Storage.prototype.setItem = function (key, value) {
      /* Chama o setItem original primeiro (localStorage continua funcionando) */
      _origSetItem.call(this, key, value);

      /* Sincroniza apenas se ativo, for o localStorage e a chave for mapeada */
      if (_active && this === localStorage && SYNC_MAP[key]) {
        _pushToCloud(key, value).catch(function (err) {
          console.warn('[SyncCloud] Erro ao enviar', key, ':', err.message || err);
        });
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Push: localStorage → Supabase                                        */
  /* ------------------------------------------------------------------ */
  function _pushToCloud(key, jsonValue) {
    if (!_active || !navigator.onLine || !_client) {
      return Promise.resolve();
    }

    var table = SYNC_MAP[key];
    if (!table) return Promise.resolve();

    var ts = new Date().toISOString();

    /* Config: armazena objeto completo como uma única linha */
    if (OBJECT_KEYS[key]) {
      var configObj;
      try {
        configObj = JSON.parse(jsonValue || '{}');
      } catch (e) {
        return Promise.resolve();
      }
      if (!configObj || typeof configObj !== 'object') return Promise.resolve();

      var configRow = {
        id            : key,
        tipo          : 'main_config',
        valor         : configObj,
        atualizado_em : ts
      };

      return _client
        .from(table)
        .upsert([configRow], { onConflict: 'id' })
        .then(function (result) {
          if (result.error) throw result.error;
        })
        .catch(function (err) {
          console.warn('[SyncCloud] pushToCloud (config) falhou:', err.message || err);
        });
    }

    /* Array (items): upsert cada registro individualmente */
    var records;
    try {
      records = JSON.parse(jsonValue || '[]');
    } catch (e) {
      return Promise.resolve();
    }

    if (!Array.isArray(records) || records.length === 0) return Promise.resolve();

    var rows = records.map(function (r) {
      return Object.assign({}, r, { data_sincronizacao: ts });
    });

    return _client
      .from(table)
      /* onConflict: 'id' pressupõe que todas as tabelas usam 'id' como chave primária
         conforme definido nas CREATE TABLE em SUPABASE_SETUP.md */
      .upsert(rows, { onConflict: 'id' })
      .then(function (result) {
        if (result.error) throw result.error;
      })
      .catch(function (err) {
        console.warn('[SyncCloud] pushToCloud falhou para', table, ':', err.message || err);
      });
  }

  /* ------------------------------------------------------------------ */
  /* Pull: Supabase → localStorage                                        */
  /* ------------------------------------------------------------------ */
  function _pullAll() {
    if (!_active || !navigator.onLine || !_client) return Promise.resolve();

    var keys   = Object.keys(SYNC_MAP);
    var pulls  = keys.map(function (lsKey) {
      var table = SYNC_MAP[lsKey];

      /* Config: busca linha única pelo id e extrai o campo valor */
      if (OBJECT_KEYS[lsKey]) {
        return _client
          .from(table)
          .select('id, valor')
          .eq('id', lsKey)
          .maybeSingle()
          .then(function (result) {
            if (result.error) throw result.error;
            if (result.data && result.data.valor) {
              _origSetItem.call(localStorage, lsKey, JSON.stringify(result.data.valor));
              console.log('[SyncCloud] Config puxada:', table);
            }
          })
          .catch(function (err) {
            console.warn('[SyncCloud] pullAll (config) falhou para', table, ':', err.message || err);
          });
      }

      /* Array (items): busca todos os registros não deletados */
      return _client
        .from(table)
        .select('*')
        .is('deletado_em', null)
        .then(function (result) {
          if (result.error) throw result.error;
          if (result.data && result.data.length > 0) {
            /* Grava direto via _origSetItem para não acionar outro push */
            _origSetItem.call(localStorage, lsKey, JSON.stringify(result.data));
            console.log('[SyncCloud] Dados puxados:', table, '(' + result.data.length + ' registros)');
          }
        })
        .catch(function (err) {
          console.warn('[SyncCloud] pullAll falhou para', table, ':', err.message || err);
        });
    });

    return Promise.all(pulls);
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    init    : init,
    pullAll : _pullAll
  };

}());
