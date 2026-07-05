// ============================================================
// 🔥 PINOK API - FIXED (dengan MLBB_ prefix)
// ============================================================

let data = {
  keys: ['MLBB_TEST123'],
  devices: {},
  sessions: {}
};

const ADMIN_USERNAME = 'owner';
const ADMIN_PASSWORD = 'pinoganteng123';

// ============================================================
// HELPERS
// ============================================================

function isExpired(d) {
  if (!d) return false;
  return new Date() > new Date(d);
}

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let r = 'MLBB_';
  for (let i = 0; i < 12; i++) {
    r += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return r;
}

function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < 32; i++) {
    r += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return r;
}

function generateToken(resource, serial) {
  const base = `${resource}|${serial}|${Date.now()}`;
  let h1 = 0, h2 = 0;
  for (let i = 0; i < base.length; i++) {
    const c = base.charCodeAt(i);
    h1 = ((h1 << 5) - h1) + c;
    h1 = h1 & h1;
    h2 = ((h2 << 7) - h2) + (c * 31);
    h2 = h2 & h2;
  }
  const p1 = Math.abs(h1).toString(16).padStart(8, '0');
  const p2 = Math.abs(h2).toString(16).padStart(8, '0');
  const p3 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
  const p4 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
  return `${p1}${p2}${p3}${p4}`;
}

function generateRng() {
  return Math.floor(Math.random() * 100000000) + 1700000000;
}

function formatDate(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function formatExpired(d) {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default function handler(req, res) {
  // HEADERS
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url.split('?')[0];

  // ============================================================
  // 🔥 ROUTING: /api/admin/login
  // ============================================================
  if (url === '/api/admin/login' && req.method === 'POST') {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        status: false,
        reason: "Username and password required"
      });
    }

    if (ADMIN_USERNAME !== username || ADMIN_PASSWORD !== password) {
      return res.status(401).json({
        status: false,
        reason: "Invalid username or password"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        username: ADMIN_USERNAME,
        role: "admin",
        session: Date.now().toString(36) + Math.random().toString(36).substring(2)
      }
    });
  }

  // ============================================================
  // 🔥 ROUTING: /api/admin/keys
  // ============================================================
  if (url === '/api/admin/keys') {
    // GET - List keys
    if (req.method === 'GET') {
      return res.status(200).json({
        status: true,
        data: {
          keys: data.keys,
          total: data.keys.length,
          devices: data.devices
        }
      });
    }

    // POST - Generate key
    if (req.method === 'POST') {
      const { count = 1, username } = req.body;
      
      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({
          status: false,
          reason: "Unauthorized"
        });
      }

      const newKeys = [];
      for (let i = 0; i < count; i++) {
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
        data: {
          keys: newKeys,
          total: data.keys.length
        }
      });
    }

    // DELETE - Hapus key
    if (req.method === 'DELETE') {
      const { key, username } = req.body;
      
      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({
          status: false,
          reason: "Unauthorized"
        });
      }

      if (!key) {
        return res.status(400).json({
          status: false,
          reason: "Key is required"
        });
      }

      if (!data.keys.includes(key)) {
        return res.status(404).json({
          status: false,
          reason: "Key not found"
        });
      }

      data.keys = data.keys.filter(k => k !== key);
      delete data.devices[key];

      return res.status(200).json({
        status: true,
        message: "Key deleted",
        data: {
          key: key,
          total: data.keys.length
        }
      });
    }

    return res.status(405).json({
      status: false,
      reason: "Method Not Allowed"
    });
  }

  // ============================================================
  // 🔥 ROUTING: /api/admin/devices
  // ============================================================
  if (url === '/api/admin/devices' && req.method === 'GET') {
    return res.status(200).json({
      status: true,
      data: data.devices
    });
  }

  // ============================================================
  // 🔥 ROUTING: /api/game/MLBB
  // ============================================================
  if (url === '/api/game/MLBB') {
    try {
      let game, version, user_key, serial, resource;

      if (req.method === 'GET') {
        game = req.query.game;
        version = req.query.version;
        user_key = req.query.user_key;
        serial = req.query.serial;
        resource = req.query.resource;
      } else {
        game = req.body.game || req.query.game;
        version = req.body.version || req.query.version;
        user_key = req.body.user_key || req.query.user_key;
        serial = req.body.serial || req.query.serial;
        resource = req.body.resource || req.query.resource;
      }

      if (!game || !version || !user_key || !serial || !resource) {
        return res.status(400).json({
          status: false,
          reason: "Missing parameters"
        });
      }

      if (game !== 'MLBB') {
        return res.status(400).json({
          status: false,
          reason: "Invalid game"
        });
      }

      if (!data.keys.includes(user_key)) {
        return res.status(200).json({
          status: false,
          reason: "MEMBER KEY NOT REGISTERED"
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
            reason: "DEVICE LIMIT IS OUT"
          });
        }
      }

      // Generate
      const token = generateToken(resource, serial);
      const rng = generateRng();
      const now = new Date();
      const expired = new Date(now.getTime() + 3600000);
      const sessionId = generateSessionId();

      data.devices[user_key] = {
        serial: serial,
        datte: formatDate(now),
        expired: formatExpired(expired)
      };

      data.sessions[sessionId] = {
        created: now.toISOString(),
        last_used: now.toISOString(),
        user_key: user_key
      };

      return res.status(200).json({
        status: true,
        data: {
          Datte: formatDate(now),
          token: token,
          rng: rng,
          tittle: "kyvrennn",
          versi: version,
          instance: "Instance",
          expired: formatExpired(expired),
          session_id: sessionId
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
  // 🔥 ROUTING: /MLBB (SAMA DENGAN /api/game/MLBB)
  // ============================================================
  if (url === '/MLBB') {
    try {
      let game, version, user_key, serial, resource;

      if (req.method === 'GET') {
        game = req.query.game;
        version = req.query.version;
        user_key = req.query.user_key;
        serial = req.query.serial;
        resource = req.query.resource;
      } else {
        game = req.body.game || req.query.game;
        version = req.body.version || req.query.version;
        user_key = req.body.user_key || req.query.user_key;
        serial = req.body.serial || req.query.serial;
        resource = req.body.resource || req.query.resource;
      }

      if (!game || !version || !user_key || !serial || !resource) {
        return res.status(400).json({
          status: false,
          reason: "Missing parameters"
        });
      }

      if (game !== 'MLBB') {
        return res.status(400).json({
          status: false,
          reason: "Invalid game"
        });
      }

      if (!data.keys.includes(user_key)) {
        return res.status(200).json({
          status: false,
          reason: "MEMBER KEY NOT REGISTERED"
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
            reason: "DEVICE LIMIT IS OUT"
          });
        }
      }

      // Generate
      const token = generateToken(resource, serial);
      const rng = generateRng();
      const now = new Date();
      const expired = new Date(now.getTime() + 3600000);
      const sessionId = generateSessionId();

      data.devices[user_key] = {
        serial: serial,
        datte: formatDate(now),
        expired: formatExpired(expired)
      };

      data.sessions[sessionId] = {
        created: now.toISOString(),
        last_used: now.toISOString(),
        user_key: user_key
      };

      return res.status(200).json({
        status: true,
        data: {
          Datte: formatDate(now),
          token: token,
          rng: rng,
          tittle: "kyvrennn",
          versi: version,
          instance: "Instance",
          expired: formatExpired(expired),
          session_id: sessionId
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
  // 404
  // ============================================================
  return res.status(404).json({
    status: false,
    reason: "Not Found"
  });
}