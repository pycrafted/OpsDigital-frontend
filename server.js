const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;
const dist = path.join(__dirname, 'dist');

// Fichiers statiques du build Vite
app.use(express.static(dist));

// Fallback SPA : toute route inconnue → index.html (React Router)
app.get('*', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`OpsDigital frontend ready on http://127.0.0.1:${port}`);
});
