// ============================================================
// 🔥 PINOK API - mlbb.js (VERSI SUPER SIMPLE)
// ============================================================

const ADMIN_USERNAME = 'owner';
const ADMIN_PASSWORD = 'pinoganteng123';

// Database
let data = {
  keys: ['PINOKCRACK_TEST123'],
  devices: {}
};

// ============================================================
// HELPER
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
  const base = `${resource}|${serial}|${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

function generateRng() {
  return Math.floor(Math.random() * 100000000) + 1700000000;
}

function formatDate(date) {
  const days = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = days[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function formatExpired(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function isExpired(expiredDate) {
  if (!expiredDate) return false;
  return new Date() > new Date(expiredDate);
}

// ============================================================
// MAIN
// ============================================================
export default function handler(req, res) {
  // HEADERS
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============================================================
  // GET /api/mlbb
  // ============================================================
  if (req.method === 'GET') {
    try {
      const { game, version, user_key, serial, resource } = req.query;

      // Validasi
      if (!game || !version || !user_key || !serial || !resource) {
        return res.status(400).json({
          status: false,
          reason: 'Missing parameters'
        });
      }

      if (game !== 'MLBB') {
        return res.status(400).json({
          status: false,
          reason: 'Invalid game'
        });
      }

      // Cek key
      if (!data.keys.includes(user_key)) {
        return res.status(200).json({
          status: false,
          reason: 'MEMBER KEY NOT REGISTERED'
        });
      }

      // Cek device
      if (data.devices[user_key]) {
        const existing = data.devices[user_key];
        if (isExpired(existing.expired)) {
          delete data.devices[user_key];
        } else if (existing.serial !== serial) {
          return res.status(200).json({
            status: false,
            reason: 'DEVICE LIMIT IS OUT'
          });
        }
      }

      // Generate
      const token = generateToken(resource, serial);
      const rng = generateRng();
      const now = new Date();
      const expired = new Date(now.getTime() + 3600000);

      data.devices[user_key] = {
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
      return res.status(500).json({
        status: false,
        reason: e.message
      });
    }
  }

  // ============================================================
  // POST /api/mlbb
  // ============================================================
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { action, username, password, key, count } = body;

      // LOGIN
      if (action === 'login') {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          return res.status(200).json({
            status: true,
            message: 'Login successful',
            data: { username: ADMIN_USERNAME, role: 'admin' }
          });
        } else {
          return res.status(401).json({
            status: false,
            reason: 'Invalid username or password'
          });
        }
      }

      // GENERATE KEY
      if (action === 'generate') {
        if (username !== ADMIN_USERNAME) {
          return res.status(401).json({
            status: false,
            reason: 'Unauthorized'
          });
        }

        const newKeys = [];
        const total = count || 1;

        for (let i = 0; i < total; i++) {
          let newKey;
          let attempts = 0;
          do {
            newKey = generateKey();
            attempts++;
          } while (data.keys.includes(newKey) && attempts < 100);

          if (!data.keys.includes(newKey)) {
            data.keys.push(newKey);
            newKeys.push(newKey);
          }
        }

        return res.status(200).json({
          status: true,
          message: `${newKeys.length} key(s) generated`,
          data: { keys: newKeys, total: data.keys.length }
        });
      }

      // LIST KEYS
      if (action === 'list') {
        if (username !== ADMIN_USERNAME) {
          return res.status(401).json({
            status: false,
            reason: 'Unauthorized'
          });
        }

        return res.status(200).json({
          status: true,
          data: {
            keys: data.keys,
            total: data.keys.length,
            devices: data.devices
          }
        });
      }

      // DELETE KEY
      if (action === 'delete') {
        if (username !== ADMIN_USERNAME) {
          return res.status(401).json({
            status: false,
            reason: 'Unauthorized'
          });
        }

        if (!key) {
          return res.status(400).json({
            status: false,
            reason: 'Key required'
          });
        }

        if (!data.keys.includes(key)) {
          return res.status(404).json({
            status: false,
            reason: 'Key not found'
          });
        }

        data.keys = data.keys.filter(k => k !== key);
        delete data.devices[key];

        return res.status(200).json({
          status: true,
          message: 'Key deleted',
          data: { key: key, total: data.keys.length }
        });
      }

      return res.status(400).json({
        status: false,
        reason: 'Invalid action. Use: login, generate, list, delete'
      });

    } catch (e) {
      return res.status(500).json({
        status: false,
        reason: e.message
      });
    }
  }

  // ============================================================
  // 404
  // ============================================================
  return res.status(404).json({
    status: false,
    reason: 'Not Found'
  });
}