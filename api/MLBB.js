// ============================================================
// 🔥 PINOK API - RNG AWALAN 17
// ============================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'pinok.json');

function loadData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.log('Error loading database:', e.message);
  }
  return { keys: [], devices: {} };
}

function saveData(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.log('Error saving database:', e.message);
    return false;
  }
}

const ADMIN_USERNAME = 'owner';
const ADMIN_PASSWORD = 'pinoganteng123';
const ADMIN_TOKEN = '8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c';

function isExpired(expiredDate) {
  if (!expiredDate) return false;
  const now = new Date();
  const expired = new Date(expiredDate);
  return now > expired;
}

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PINOKCRACK_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// 🔑 GENERATE TOKEN 32 KARAKTER
// ============================================================
function generateToken(resource, serial) {
  const baseString = `${resource}|${serial}|${Date.now()}`;
  
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

// ============================================================
// 🎲 GENERATE RNG AWALAN 17
// ============================================================
function generateRng() {
  // Range: 1700000000 - 1799999999
  return Math.floor(Math.random() * 100000000) + 1700000000;
}

// ============================================================
// 📅 FORMAT DATE
// ============================================================
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

// ============================================================
// 🚀 MAIN HANDLER
// ============================================================
export default function handler(req, res) {
  let data = loadData();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

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
        admin_token: ADMIN_TOKEN,
        expires_in: "24h",
        expires_at: formatExpired(new Date(Date.now() + 24*60*60*1000))
      }
    });
  }

  // ============================================================
  // 🔥 ROUTING: /api/admin/keys
  // ============================================================
  if (url === '/api/admin/keys') {
    const admin_token = req.body?.admin_token || req.query?.admin_token;
    
    if (admin_token !== ADMIN_TOKEN) {
      return res.status(401).json({
        status: false,
        reason: "UNAUTHORIZED ADMIN"
      });
    }

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

    if (req.method === 'POST') {
      const { count = 1 } = req.body;
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

      saveData(data);

      return res.status(200).json({
        status: true,
        message: `${newKeys.length} key(s) generated successfully`,
        data: {
          keys: newKeys,
          total: data.keys.length
        }
      });
    }

    if (req.method === 'DELETE') {
      const { key } = req.body;
      
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
      saveData(data);

      return res.status(200).json({
        status: true,
        message: "Key deleted successfully",
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
  // 🔥 ROUTING: /MLBB
  // ============================================================
  if (url === '/MLBB') {
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
        reason: "Missing required parameters"
      });
    }

    if (game !== 'MLBB') {
      return res.status(400).json({
        status: false,
        reason: "Invalid game"
      });
    }

    if (!data.keys.includes(user_key)) {
      console.log(`[LOG] Key not registered: ${user_key}`);
      return res.status(200).json({
        status: false,
        reason: "MEMBER KEY NOT REGISTERED"
      });
    }

    if (data.devices[user_key]) {
      const existingDevice = data.devices[user_key];
      
      if (isExpired(existingDevice.expired)) {
        console.log(`[LOG] Device expired for ${user_key}, allowing new device...`);
        delete data.devices[user_key];
      } else {
        if (existingDevice.serial !== serial) {
          console.log(`[LOG] Device limit reached for ${user_key}. Serial: ${serial} not match with ${existingDevice.serial}`);
          return res.status(200).json({
            status: false,
            reason: "DEVICE LIMIT IS OUT"
          });
        }
      }
    }

    // ============================================================
    // 🎯 GENERATE TOKEN & RNG AWALAN 17
    // ============================================================
    const token = generateToken(resource, serial);
    const rng = generateRng();  // ← AWALAN 17

    const now = new Date();
    const expired = new Date(now.getTime() + 3600000);

    data.devices[user_key] = {
      serial: serial,
      datte: formatDate(now),
      expired: formatExpired(expired)
    };

    saveData(data);

    console.log(`[LOG] ✅ Device saved for ${user_key}`);
    console.log(`[LOG] Token: ${token}`);
    console.log(`[LOG] RNG: ${rng}`);

    // ============================================================
    // 📤 RESPONSE
    // ============================================================
    const response = {
      status: true,
      data: {
        Datte: formatDate(now),
        token: token,
        rng: rng,  // ← 1783163808 (awalan 17)
        tittle: "kyvrennn",
        versi: version,
        instance: "Instance",
        expired: formatExpired(expired)
      },
      features: {
        esp_line: true,
        esp_box: true,
        ATTIC_V35: true,
        ATTIC_V36: true,
        ATTIC_V37: true
      }
    };

    return res.status(200).json(response);
  }

  return res.status(404).json({
    status: false,
    reason: "Not Found"
  });
}