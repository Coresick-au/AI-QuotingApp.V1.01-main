// Preload script for Electron
// This file runs in a sandboxed context with access to Node.js APIs
// Use this to expose specific APIs to the renderer process if needed

window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron preload script loaded');
});
