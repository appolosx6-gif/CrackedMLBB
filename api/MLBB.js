// ============================================================
// 🔥 PINOK API - FINAL FIX
// ============================================================

const ADMIN_USERNAME = 'owner';
const ADMIN_PASSWORD = 'pinoganteng123';

// Database (in-memory)
let keys = ['PINOKCRACK_TEST123'];
let devices = {};

// ============================================================
// HELPERS
// ============================================================

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PINOKCRACK_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateToken(resource, serial) {
  const base = resource + serial + Date.now();
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
}

function generateRng() {
  return Math.floor(Math.random() * 100000000) + 1700000000;
}

function formatDate(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return String(d.getDate()).padStart(2, '0') + '-' + months[d.getMonth()] + '-' + d.getFullYear() + 
         ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function formatExpired(d) {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function isExpired(d) {
  return new Date() > new Date(d);
}

// ============================================================
// HANDLER
// ============================================================
export default function handler(req, res) {
  // HEADERS
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url.split('?')[0];

  // ============================================================
  // GET /api/mlbb - CHECK
  // ============================================================
  if (req.method === 'GET' && url === '/api/mlbb') {
    try {
      const { game, version, user_key, serial, resource } = req.query;

      if (!game || !version || !user_key || !serial || !resource) {
        return res.status(400).json({ status: false, reason: 'Missing parameters' });
      }

      if (game !== 'MLBB') {
        return res.status(400).json({ status: false, reason: 'Invalid game' });
      }

      if (!keys.includes(user_key)) {
        return res.status(200).json({ status: false, reason: 'MEMBER KEY NOT REGISTERED' });
      }

      // CEK DEVICE
      if (devices[user_key]) {
        if (isExpired(devices[user_key].expired)) {
          delete devices[user_key];
        } else if (devices[user_key].serial !== serial) {
          return res.status(200).json({ status: false, reason: 'DEVICE LIMIT IS OUT' });
        }
      }

      // GENERATE
      const now = new Date();
      const expired = new Date(now.getTime() + 3600000);
      const token = generateToken(resource, serial);
      const rng = generateRng();

      devices[user_key] = {
        serial: serial,
        datte: formatDate(now),
        expired: formatExpired(expired)
      };

      return res.status(200).json({
        status: true,
        data: {
          Datte: formatDate(now),
          token: token,
          rng: rng,
          tittle: 'kyvrennn',
          versi: version,
          instance: 'Instance',
          expired: formatExpired(expired)
        },
        features: {
          esp_line: true,
          esp_box: true,
          ATTIC_V35: true,
          ATTIC_V36: true,
          ATTIC_V37: true
        }
      });

    } catch (e) {
      return res.status(500).json({ status: false, reason: e.message });
    }
  }

  // ============================================================
  // POST /api/mlbb/login
  // ============================================================
  if (req.method === 'POST' && url === '/api/mlbb/login') {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({ status: false, reason: 'Username & password required' });
      }

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.status(200).json({
          status: true,
          message: 'Login successful',
          data: { username: ADMIN_USERNAME, role: 'admin' }
        });
      }

      return res.status(401).json({ status: false, reason: 'Invalid username or password' });

    } catch (e) {
      return res.status(500).json({ status: false, reason: e.message });
    }
  }

  // ============================================================
  // POST /api/mlbb/generate
  // ============================================================
  if (req.method === 'POST' && url === '/api/mlbb/generate') {
    try {
      const { username, count } = req.body || {};

      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ status: false, reason: 'Unauthorized' });
      }

      const total = count || 1;
      const newKeys = [];

      for (let i = 0; i < total; i++) {
        let k;
        let attempts = 0;
        do {
          k = generateKey();
          attempts++;
        } while (keys.includes(k) && attempts < 100);

        if (!keys.includes(k)) {
          keys.push(k);
          newKeys.push(k);
        }
      }

      return res.status(200).json({
        status: true,
        message: `${newKeys.length} key(s) generated`,
        data: { keys: newKeys, total: keys.length }
      });

    } catch (e) {
      return res.status(500).json({ status: false, reason: e.message });
    }
  }

  // ============================================================
  // POST /api/mlbb/list
  // ============================================================
  if (req.method === 'POST' && url === '/api/mlbb/list') {
    try {
      const { username } = req.body || {};

      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ status: false, reason: 'Unauthorized' });
      }

      return res.status(200).json({
        status: true,
        data: { keys: keys, total: keys.length, devices: devices }
      });

    } catch (e) {
      return res.status(500).json({ status: false, reason: e.message });
    }
  }

  // ============================================================
  // POST /api/mlbb/delete
  // ============================================================
  if (req.method === 'POST' && url === '/api/mlbb/delete') {
    try {
      const { username, key } = req.body || {};

      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ status: false, reason: 'Unauthorized' });
      }

      if (!key) {
        return res.status(400).json({ status: false, reason: 'Key required' });
      }

      if (!keys.includes(key)) {
        return res.status(404).json({ status: false, reason: 'Key not found' });
      }

      keys = keys.filter(k => k !== key);
      delete devices[key];

      return res.status(200).json({
        status: true,
        message: 'Key deleted',
        data: { key: key, total: keys.length }
      });

    } catch (e) {
      return res.status(500).json({ status: false, reason: e.message });
    }
  }

  // ============================================================
  // 404
  // ============================================================
  return res.status(404).json({ status: false, reason: 'Not Found' });
}
