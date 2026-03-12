const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Sert les fichiers statiques
app.use(express.static(__dirname));

// Proxy toutes les requêtes /api vers le backend Symfony
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:8000',
  changeOrigin: true
}));

// Route SPA pour le front
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => {
  console.log('Serveur front sur http://localhost:3000');
});