// Read .env and generate Capacitor + other configs
const fs = require('fs');
const path = require('path');
const os = require('os');

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
  });
  return env;
}

// Auto-detect local IP if not set
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

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.error('No .env file found. Copy .env.example to .env first.');
  process.exit(1);
}

const env = parseEnv(envPath);

// Generate capacitor.config.json
const url = env.CAPACITOR_URL || `http://${getLocalIP()}:5173`;
const config = {
  appId: 'com.skateboard.shop',
  appName: '地面飞行滑板',
  webDir: 'dist',
  server: {
    url: url.replace(/\/$/, ''),
    cleartext: url.startsWith('http://'),
  },
};

const configPath = path.join(root, 'packages', 'frontend', 'capacitor.config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('Generated: capacitor.config.json');
console.log('  URL:', config.server.url);
