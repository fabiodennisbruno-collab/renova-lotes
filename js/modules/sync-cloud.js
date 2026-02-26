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
 *  crm_clientes, crm_produtos_pdv, crm_vendas_pdv, crm_caixa
 */
var SyncCloud = (function () {

  /* Mapa chave localStorage → tabela Supabase */
  var SYNC_MAP = {
    'crm_clientes':     'crm_clientes',
    'crm_produtos_pdv': 'crm_produtos_pdv',
    'crm_vendas_pdv':   'crm_vendas_pdv',
    'crm_caixa':        'crm_caixa'
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

    var records;
    try {
      records = JSON.parse(jsonValue || '[]');
    } catch (e) {
      return Promise.resolve();
    }

    if (!Array.isArray(records) || records.length === 0) return Promise.resolve();

    var ts   = new Date().toISOString();
    /* data_sincronizacao registra o momento do envio ao Supabase (não a criação do registro) */
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
      return _client
        .from(table)
        .select('*')
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
