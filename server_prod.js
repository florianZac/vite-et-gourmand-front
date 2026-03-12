// server_prod.js
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// fichiers statiques
app.use(express.static(__dirname));

// Proxy toutes les requêtes /api vers le backend
// NE PAS OUBLIER DE Remplacer TARGET_URL par l'URL publique de le  backend Symfony
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true
}));

// Route SPA pour le front
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Utilisation du port dynamique Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur front démarré sur le port ${PORT}`);
});