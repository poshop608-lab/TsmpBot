// Uploads a finished recording to Cloudflare R2 using Cloudflare's own
// management API (not the S3-compatible API — avoids needing a separate
// R2 Access Key ID/Secret pair, just reuses the standard Cloudflare API token).
const fs = require('fs');
const https = require('https');

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN;
const BUCKET = process.env.R2_BUCKET || 'smp-recordings';
const PUBLIC_BASE = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

function putObject(key, filePath, contentType) {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': stats.size,
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`R2 upload failed (${res.statusCode}): ${body.slice(0, 300)}`));
      });
    });
    req.on('error', reject);
    fs.createReadStream(filePath).pipe(req);
  });
}

async function uploadRecording(filePath, fileName) {
  await putObject(fileName, filePath, 'video/mp4');
  fs.unlink(filePath, () => {}); // clean up local file once safely uploaded
  return `${PUBLIC_BASE.replace(/\/$/, '')}/${fileName}`;
}

module.exports = { uploadRecording };
