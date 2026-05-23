// First-run: auto-generate .env from template. If already exists, skip.
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

const mode = process.argv[2]; // 'prod' or 'dev'
if (!mode || !['prod', 'dev'].includes(mode)) {
  console.error('Usage: node prepare-env.cjs [prod|dev]');
  process.exit(1);
}

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
        return net.address;
      }
    }
  }
  return '192.168.x.x';
}

// User already has a .env — don't touch it, just sync configs
if (fs.existsSync(envPath)) {
  console.log('.env found — using existing configuration');
  require('./sync-config.cjs');
  process.exit(0);
}

// First run — generate .env from template
const ip = getLocalIP();
console.log(`First run — detected IP: ${ip}`);

let content = fs.readFileSync(examplePath, 'utf-8');
content = content.replace(/^CAPACITOR_URL=.*/m, `CAPACITOR_URL=http://${ip}:5173`);
content = content.replace(/^API_BASE_URL=.*/m, `API_BASE_URL=http://${ip}:3000`);

fs.writeFileSync(envPath, content);
console.log('.env generated — edit it freely, it won\'t be overwritten');

require('./sync-config.cjs');
