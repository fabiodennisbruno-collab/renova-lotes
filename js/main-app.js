/* main-app.js — Orquestrador principal da integração Supabase */
'use strict';

/**
 * MainApp — inicializa todos os módulos de sincronização na ordem correta.
 *
 * Ordem de inicialização:
 *  1. SyncCloud   — intercepta localStorage.setItem e faz pull inicial
 *  2. OfflineSync — abre IndexedDB e processa fila pendente
 *  3. RealtimeSync — conecta ao Supabase Realtime via WebSocket
 *  4. CrossTabSync — monitora mudanças entre abas do mesmo navegador
 *  5. SyncStatusUI — atualiza badge de status na interface
 *  6. Service Worker — registra SW para suporte offline e cache
 */
(function () {

  /* ------------------------------------------------------------------ */
  /* Inicializa os módulos de sincronização                              */
  /* ------------------------------------------------------------------ */
  function _initModules() {
    var client = typeof supabaseClient !== 'undefined' ? supabaseClient : null;

    /* 1. SyncCloud: intercepta localStorage.setItem e sincroniza com Supabase */
    if (typeof SyncCloud !== 'undefined') {
      SyncCloud.init(client);
    }

    /* 2. OfflineSync: abre IndexedDB e processa fila de operações pendentes */
    if (typeof OfflineSync !== 'undefined') {
      OfflineSync.init(client);
    }

    /* 3. RealtimeSync: conecta ao Supabase Realtime (WebSocket) */
    if (typeof RealtimeSync !== 'undefined' && client) {
      RealtimeSync.initRealtimeSync(client);
    }

    /* 4. CrossTabSync: monitora mudanças entre abas do mesmo navegador */
    if (typeof CrossTabSync !== 'undefined') {
      CrossTabSync.watchStorageChanges();
    }

    /* 5. SyncStatusUI: inicializa badge de status e listeners de eventos */
    if (typeof SyncStatusUI !== 'undefined') {
      SyncStatusUI.init();
    }

    console.log('[MainApp] Módulos de sincronização inicializados.');
  }

  /* ------------------------------------------------------------------ */
  /* Registra o Service Worker para suporte offline                     */
  /* ------------------------------------------------------------------ */
  function _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.warn('[MainApp] Falha no registro do Service Worker:', err);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ponto de entrada — aguarda o DOM estar pronto                      */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    _initModules();
    _registerServiceWorker();
  });

}());
