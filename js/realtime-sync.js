/* realtime-sync.js — Sincronização em tempo real via Supabase Realtime */
'use strict';

/**
 * RealtimeSync — assinatura de mudanças em tempo real via WebSocket (Supabase Realtime).
 *
 * Comportamento:
 *  - Abre um canal Realtime por tabela sincronizada
 *  - Quando um registro muda remotamente, atualiza o localStorage local
 *  - Usa estratégia last-write-wins para resolver conflitos de timestamp
 *  - Emite CustomEvents para que os módulos da UI se atualizem automaticamente
 *
 * Tabelas monitoradas:
 *  crm_clientes, crm_produtos_pdv, crm_vendas_pdv, crm_caixa
 */
var RealtimeSync = (function () {

  var TABLES = [
    { table: 'crm_clientes',     lsKey: 'crm_clientes',     event: 'clientesUpdated' },
    { table: 'crm_produtos_pdv', lsKey: 'crm_produtos_pdv', event: 'produtosUpdated' },
    { table: 'crm_vendas_pdv',   lsKey: 'crm_vendas_pdv',   event: 'vendasUpdated'   },
    { table: 'crm_caixa',        lsKey: 'crm_caixa',        event: 'caixaUpdated'    }
  ];

  /* Janela de tempo (ms) para considerar duas edições como conflito simultâneo */
  var CONFLICT_WINDOW_MS = 5000;

  var _client       = null;
  var _channels     = [];
  var _active       = false;
  var _lastSync     = null;
  var _conflictCount = 0;

  /* ------------------------------------------------------------------ */
  /* Inicializa e conecta ao Supabase Realtime                           */
  /* ------------------------------------------------------------------ */
  function initRealtimeSync(client) {
    if (!client) {
      console.info('[RealtimeSync] Supabase não configurado — realtime desativado.');
      return;
    }

    _client = client;
    _active = true;

    subscribeToClientes();
    subscribeToProducts();
    subscribeToVendas();
    subscribeToCaixa();

    console.log('[RealtimeSync] Conectado ao Supabase Realtime. Monitorando:', TABLES.map(function (t) { return t.table; }).join(', '));
  }

  /* ------------------------------------------------------------------ */
  /* Subscreve mudanças de clientes                                      */
  /* ------------------------------------------------------------------ */
  function subscribeToClientes() {
    _subscribe(TABLES[0]);
  }

  /* ------------------------------------------------------------------ */
  /* Subscreve mudanças de produtos                                      */
  /* ------------------------------------------------------------------ */
  function subscribeToProducts() {
    _subscribe(TABLES[1]);
  }

  /* ------------------------------------------------------------------ */
  /* Subscreve mudanças de vendas                                        */
  /* ------------------------------------------------------------------ */
  function subscribeToVendas() {
    _subscribe(TABLES[2]);
  }

  /* ------------------------------------------------------------------ */
  /* Subscreve mudanças de caixa                                         */
  /* ------------------------------------------------------------------ */
  function subscribeToCaixa() {
    _subscribe(TABLES[3]);
  }

  /* ------------------------------------------------------------------ */
  /* Cria e registra um canal Realtime para uma tabela                   */
  /* ------------------------------------------------------------------ */
  function _subscribe(tableConfig) {
    if (!_client) return;

    var channel = _client
      .channel('sync-' + tableConfig.table)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableConfig.table },
        function (payload) {
          handleRemoteUpdate(tableConfig, payload);
        }
      )
      .subscribe(function (status) {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeSync] Canal ativo:', tableConfig.table);
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[RealtimeSync] Erro no canal:', tableConfig.table);
        }
      });

    _channels.push(channel);
  }

  /* ------------------------------------------------------------------ */
  /* Processa uma mudança remota recebida via WebSocket                  */
  /* ------------------------------------------------------------------ */
  function handleRemoteUpdate(tableConfig, payload) {
    if (!payload || !payload.new) return;

    var eventType  = payload.eventType; /* INSERT | UPDATE | DELETE */
    var remoteRow  = payload.new;
    var lsKey      = tableConfig.lsKey;

    try {
      var localList = JSON.parse(localStorage.getItem(lsKey) || '[]');
      var updated   = false;

      if (eventType === 'DELETE') {
        var deletedId = payload.old && payload.old.id;
        if (deletedId != null) {
          localList = localList.filter(function (r) { return r.id !== deletedId; });
          updated   = true;
        }
      } else {
        /* INSERT ou UPDATE: aplica last-write-wins */
        var idx = localList.findIndex(function (r) { return r.id === remoteRow.id; });

        if (idx < 0) {
          /* Novo registro remoto — inserir */
          localList.push(remoteRow);
          updated = true;
        } else {
          var localRow  = localList[idx];
          var hasConflict = detectConflict(lsKey, localRow, remoteRow);

          if (hasConflict) {
            _conflictCount++;
            if (typeof ConflictDetector !== 'undefined') {
              ConflictDetector.notifyConflict(tableConfig.table, { local: localRow, remote: remoteRow });
            }
          }

          /* Resolve com last-write-wins */
          var resolved = _resolveLastWriteWins(localRow, remoteRow);
          localList[idx] = resolved;
          updated = true;
        }
      }

      if (updated) {
        /* Grava via localStorage.setItem — SyncCloud irá upsert de volta (idempotente) */
        localStorage.setItem(lsKey, JSON.stringify(localList));

        _lastSync = new Date();
        _emitUpdateEvent(tableConfig.event, localList);
        _notifySyncStatus();
      }

    } catch (err) {
      console.warn('[RealtimeSync] Erro ao processar mudança remota em', tableConfig.table, ':', err.message || err);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Detecta se há conflito entre versão local e remota                  */
  /* ------------------------------------------------------------------ */
  function detectConflict(table, localRecord, remoteRecord) {
    if (!localRecord || !remoteRecord) return false;

    var localTs  = _getTimestamp(localRecord);
    var remoteTs = _getTimestamp(remoteRecord);

    /* Conflito: ambos foram modificados dentro do intervalo configurado */
    var diff = Math.abs(localTs - remoteTs);
    return diff > 0 && diff < CONFLICT_WINDOW_MS;
  }

  /* ------------------------------------------------------------------ */
  /* Resolve conflito com last-write-wins                                */
  /* ------------------------------------------------------------------ */
  function _resolveLastWriteWins(localRecord, remoteRecord) {
    if (typeof ConflictResolver !== 'undefined') {
      return ConflictResolver.resolveLastWriteWins(localRecord, remoteRecord);
    }
    var localTs  = _getTimestamp(localRecord);
    var remoteTs = _getTimestamp(remoteRecord);
    return localTs >= remoteTs ? localRecord : remoteRecord;
  }

  /* ------------------------------------------------------------------ */
  /* Extrai timestamp de um registro                                     */
  /* ------------------------------------------------------------------ */
  function _getTimestamp(record) {
    var ts = record.data_sincronizacao
          || record.dataCadastro
          || record.dataISO
          || record.timestamp
          || null;
    return ts ? new Date(ts).getTime() : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Emite CustomEvent para que a UI se atualize                         */
  /* ------------------------------------------------------------------ */
  function _emitUpdateEvent(eventName, data) {
    try {
      var ev = new CustomEvent(eventName, { detail: data, bubbles: true });
      window.dispatchEvent(ev);
    } catch (e) {
      /* IE11 fallback */
      var ev2 = document.createEvent('CustomEvent');
      ev2.initCustomEvent(eventName, true, true, data);
      window.dispatchEvent(ev2);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Notifica o módulo de status de sincronização                        */
  /* ------------------------------------------------------------------ */
  function _notifySyncStatus() {
    if (typeof SyncQueue !== 'undefined') {
      SyncQueue.getQueueStatus().then(function (status) {
        _emitUpdateEvent('syncStatusUpdated', {
          lastSync      : _lastSync,
          conflictCount : _conflictCount,
          queueCount    : status.pendingCount
        });
      }).catch(function () {
        _emitUpdateEvent('syncStatusUpdated', {
          lastSync      : _lastSync,
          conflictCount : _conflictCount,
          queueCount    : 0
        });
      });
    } else {
      _emitUpdateEvent('syncStatusUpdated', {
        lastSync      : _lastSync,
        conflictCount : _conflictCount,
        queueCount    : 0
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Cancela todas as assinaturas ativas                                 */
  /* ------------------------------------------------------------------ */
  function unsubscribeAll() {
    if (!_client) return;
    _channels.forEach(function (ch) {
      _client.removeChannel(ch);
    });
    _channels = [];
    _active   = false;
    console.log('[RealtimeSync] Todas as assinaturas canceladas.');
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    initRealtimeSync  : initRealtimeSync,
    subscribeToClientes : subscribeToClientes,
    subscribeToProducts : subscribeToProducts,
    subscribeToVendas   : subscribeToVendas,
    subscribeToCaixa    : subscribeToCaixa,
    handleRemoteUpdate  : handleRemoteUpdate,
    detectConflict      : detectConflict,
    unsubscribeAll      : unsubscribeAll,
    getLastSync         : function () { return _lastSync; },
    getConflictCount    : function () { return _conflictCount; }
  };

}());
