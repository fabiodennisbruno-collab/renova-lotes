/* sync-status-ui.js — Módulo de UI para status de sincronização */
'use strict';

/**
 * SyncStatusUI — atualiza o badge de sincronização e contadores na UI.
 *
 * Elementos do DOM gerenciados:
 *  - syncStatusBadge  : contêiner do badge (classe: online | offline | syncing)
 *  - syncStatusDot    : ícone emoji de status
 *  - syncStatusText   : rótulo de texto
 *  - syncQueueCount   : contador de itens na fila offline
 *  - syncLastTime     : tempo desde a última sincronização
 *  - syncConflictBadge: contêiner do badge de conflitos
 *  - syncConflictCount: contador de conflitos
 */
var SyncStatusUI = (function () {

  var _badge      = null;
  var _dot        = null;
  var _label      = null;
  var _queueEl    = null;
  var _lastSyncEl = null;
  var _conflictEl = null;
  var _conflictCt = null;

  /* ------------------------------------------------------------------ */
  /* Coleta referências aos elementos do DOM                             */
  /* ------------------------------------------------------------------ */
  function _getElements() {
    _badge      = document.getElementById('syncStatusBadge');
    _dot        = document.getElementById('syncStatusDot');
    _label      = document.getElementById('syncStatusText');
    _queueEl    = document.getElementById('syncQueueCount');
    _lastSyncEl = document.getElementById('syncLastTime');
    _conflictEl = document.getElementById('syncConflictBadge');
    _conflictCt = document.getElementById('syncConflictCount');
  }

  /* ------------------------------------------------------------------ */
  /* Atualiza o badge de status (online / offline / syncing)            */
  /* ------------------------------------------------------------------ */
  function updateStatus(online, syncing) {
    if (!_badge) _getElements();
    if (!_badge) return;
    _badge.className = syncing ? 'syncing' : (online ? 'online' : 'offline');
    if (_dot)   _dot.textContent   = syncing ? '🔄' : (online ? '🟢' : '🔴');
    if (_label) _label.textContent = syncing ? 'Sincronizando…' : (online ? 'Online' : 'Offline');
  }

  /* ------------------------------------------------------------------ */
  /* Atualiza o contador de itens na fila offline                       */
  /* ------------------------------------------------------------------ */
  function updateQueueCount() {
    if (!_queueEl) _getElements();
    if (!_queueEl) return;
    if (typeof SyncQueue !== 'undefined') {
      SyncQueue.getQueueStatus().then(function (s) {
        _queueEl.textContent = s.pendingCount;
        if (s.lastProcessedAt && _lastSyncEl) {
          var diff = Math.round((Date.now() - new Date(s.lastProcessedAt).getTime()) / 1000);
          _lastSyncEl.textContent = diff < 60 ? diff + 's atrás' : Math.round(diff / 60) + 'min atrás';
        }
      }).catch(function () {});
    }
  }

  /* ------------------------------------------------------------------ */
  /* Atualiza o contador de conflitos                                   */
  /* ------------------------------------------------------------------ */
  function updateConflictCount(total) {
    if (!_conflictEl) _getElements();
    if (!_conflictEl || !_conflictCt) return;
    _conflictCt.textContent = total;
    _conflictEl.style.display = total > 0 ? '' : 'none';
  }

  /* ------------------------------------------------------------------ */
  /* Inicializa listeners de eventos de sincronização                   */
  /* ------------------------------------------------------------------ */
  function init() {
    _getElements();

    updateStatus(navigator.onLine, false);

    window.addEventListener('offline', function () {
      updateStatus(false, false);
    });

    window.addEventListener('online', function () {
      updateStatus(true, true);
      var finalize = function () { updateStatus(true, false); updateQueueCount(); };
      if (typeof SyncQueue !== 'undefined') {
        SyncQueue.processQueue().then(finalize).catch(finalize);
      } else if (typeof OfflineSync !== 'undefined') {
        OfflineSync.processQueue().then(finalize).catch(finalize);
      } else {
        finalize();
      }
    });

    /* Atualiza contagem ao processar fila */
    window.addEventListener('syncQueueChanged', function (e) {
      if (!_queueEl) _getElements();
      if (e && e.detail && _queueEl) _queueEl.textContent = e.detail.pendingCount;
      if (e && e.detail && e.detail.lastProcessedAt && _lastSyncEl) {
        var diff = Math.round((Date.now() - new Date(e.detail.lastProcessedAt).getTime()) / 1000);
        _lastSyncEl.textContent = diff < 60 ? diff + 's atrás' : Math.round(diff / 60) + 'min atrás';
      }
    });

    /* Atualiza ao receber eventos do Realtime */
    window.addEventListener('syncStatusUpdated', function (e) {
      if (!_queueEl) _getElements();
      if (!e || !e.detail) return;
      if (_queueEl && e.detail.queueCount !== undefined) _queueEl.textContent = e.detail.queueCount;
      if (_lastSyncEl && e.detail.lastSync) {
        var diff = Math.round((Date.now() - new Date(e.detail.lastSync).getTime()) / 1000);
        _lastSyncEl.textContent = diff < 60 ? diff + 's atrás' : Math.round(diff / 60) + 'min atrás';
      }
      if (e.detail.conflictCount !== undefined) updateConflictCount(e.detail.conflictCount);
    });

    /* Atualiza contador de conflitos */
    window.addEventListener('conflictDetected', function (e) {
      var total = e && e.detail && e.detail.total ? e.detail.total : 0;
      updateConflictCount(total);
    });
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    init                : init,
    updateStatus        : updateStatus,
    updateQueueCount    : updateQueueCount,
    updateConflictCount : updateConflictCount
  };

}());
