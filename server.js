const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Sert les fichiers statiques du front (ton projet local)
app.use(express.static(__dirname));

// Proxy toutes les requêtes /api vers le backend distant Heroku
app.use('/api', createProxyMiddleware({
  target: 'https://vite-et-gourmand-api-2b0eeb54e8d5.herokuapp.com',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug', // ← ajoute du debug pour voir les requêtes dans la console
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  }
}));

// Route SPA pour toutes les autres requêtes (front)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur front local sur http://localhost:${PORT}`);
  console.log(`Toutes les requêtes /api sont proxifiées vers l'API distante Heroku`);
});