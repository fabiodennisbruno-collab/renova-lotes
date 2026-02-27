/* sync-status-ui.js — Atualiza a UI de sincronização */
'use strict';

function updateSyncStatus() {
  const badge = document.getElementById('syncStatusBadge');
  const dot = document.getElementById('syncStatusDot');
  const text = document.getElementById('syncStatusText');

  if (!badge) return;

  // Detecta conexão
  const isOnline = navigator.onLine;
  
  if (isOnline) {
    badge.className = 'online';
    if (dot) dot.textContent = '🟢';
    if (text) text.textContent = 'Online';
  } else {
    badge.className = 'offline';
    if (dot) dot.textContent = '🔴';
    if (text) text.textContent = 'Offline';
  }
}

// Atualiza status quando conecta/desconecta
window.addEventListener('online', updateSyncStatus);
window.addEventListener('offline', updateSyncStatus);

// Atualiza ao carregar
document.addEventListener('DOMContentLoaded', updateSyncStatus);
