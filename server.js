const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' })); // logo base64 ke liye limit badhayein

app.post('/generate-apk', async function (req, res) {
  try {
    const { url, appName, iconBase64 } = req.body;

    if (!url || !appName) {
      return res.status(400).json({ error: 'url aur appName zaroori hai' });
    }

    // pwa2apk.com ko FormData bhejne ke liye
    // Node.js 18+ mein global FormData available hai
    const formData = new FormData();
    formData.append('url', url);
    formData.append('appName', appName);

    if (iconBase64) {
      // base64 data URL ko Blob mein convert karein
      const parts = iconBase64.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bin = Buffer.from(parts[1], 'base64');
      const blob = new Blob([bin], { type: mime });
      formData.append('icon', blob, 'icon.png');
    }

    const response = await fetch('https://pwa2apk.com/api/generate', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'pwa2apk API error: ' + response.status });
    }

    // APK response ko buffer mein lein aur frontend ko bhej dein
    const apkBuffer = await response.buffer();

    res.set({
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="app.apk"',
      'Content-Length': apkBuffer.length
    });
    res.send(apkBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', function (req, res) { res.send('OK'); });

app.listen(PORT, function () { console.log('Proxy running on port ' + PORT); });
