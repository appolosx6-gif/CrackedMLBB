// 🔥 DATA KOSONG (keys & devices)
let data = {
  keys: [],
  devices: {},
  sessions: {}  // 🔥 Tambahkan session tracking
};

// ADMIN CREDENTIAL
const ADMIN_USERNAME = 'owner';
const ADMIN_PASSWORD = 'pinoganteng123';

// Fungsi cek expired
function isExpired(expiredDate) {
  if (!expiredDate) return false;
  const now = new Date();
  const expired = new Date(expiredDate);
  return now > expired;
}

// Generate random key (PINOKCRACK_XXXXXXXXXXXX)
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PINOKCRACK_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate session ID
function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 🔥 FIX: Generate token 32 karakter (hex only)
function generateToken(resource, serial) {
  const baseString = `${resource}|${serial}|${Date.now()}`;
  
  let hash1 = 0, hash2 = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1;
    hash2 = ((hash2 << 7) - hash2) + (char * 31);
    hash2 = hash2 & hash2;
  }
  
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const part3 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
  const part4 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
  
  return `${part1}${part2}${part3}${part4}`;
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔥 CEK SESSION ID (untuk libclient.so)
  const sessionId = req.headers['x-session-id'] || req.query.session_id || req.body?.session_id;
  
  if (sessionId) {
    // Simpan atau update session
    if (!data.sessions[sessionId]) {
      data.sessions[sessionId] = {
        created: new Date().toISOString(),
        last_used: new Date().toISOString()
      };
    } else {
      data.sessions[sessionId].last_used = new Date().toISOString();
    }
  }

  // ============================================================
  // 🔥 ROUTING: /api/admin/login
  // ============================================================
  if (req.url === '/api/admin/login' && req.method === 'POST') {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        status: false,
        reason: "Username and password required"
      });
    }

    if (ADMIN_USERNAME !== username || ADMIN_PASSWORD !== password) {
      return res.status(200).json({
        status: false,
        reason: "Invalid username or password"
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        username: ADMIN_USERNAME,
        session: Date.now().toString(36) + Math.random().toString(36).substring(2)
      }
    });
  }

  // ============================================================
  // 🔥 ROUTING: /api/admin/keys
  // ============================================================
  if (req.url === '/api/admin/keys') {
    if (req.method === 'GET') {
      return res.status(200).json({
        status: true,
        data: data.keys
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

      return res.status(200).json({
        status: true,
        data: {
          message: `${newKeys.length} key(s) generated successfully`,
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
        return res.status(200).json({
          status: false,
          reason: "Key not found"
        });
      }

      data.keys = data.keys.filter(k => k !== key);

      return res.status(200).json({
        status: true,
        data: {
          message: "Key deleted successfully",
          key: key,
          total: data.keys.length
        }
      });
    }

    if (req.method === 'PUT') {
      const { key, expired } = req.body;
      
      if (!key || !expired) {
        return res.status(400).json({
          status: false,
          reason: "Key and expired date are required"
        });
      }

      if (!data.devices[key]) {
        return res.status(200).json({
          status: false,
          reason: "Key not found in devices"
        });
      }

      data.devices[key].expired = expired;

      return res.status(200).json({
        status: true,
        data: {
          message: "Expired date updated successfully",
          key: key,
          expired: expired
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
  if (req.url === '/api/admin/devices' && req.method === 'GET') {
    return res.status(200).json({
      status: true,
      data: data.devices
    });
  }

  // ============================================================
  // 🔥 ROUTING: /api/game/MLBB (UNTUK libclient.so)
  // ============================================================
  if (req.url === '/api/game/MLBB' || req.url.startsWith('/api/game/MLBB?')) {
    let game, version, user_key, serial, resource;

    // Ambil parameter dari query
    if (req.method === 'GET') {
      game = req.query.game;
      version = req.query.version;
      user_key = req.query.user_key;
      serial = req.query.serial;
      resource = req.query.resource;
    } else {
      if (req.body && Object.keys(req.body).length > 0) {
        game = req.body.game;
        version = req.body.version;
        user_key = req.body.user_key;
        serial = req.body.serial;
        resource = req.body.resource;
      }
      
      if (!game || !version || !user_key || !serial || !resource) {
        game = req.query.game;
        version = req.query.version;
        user_key = req.query.user_key;
        serial = req.query.serial;
        resource = req.query.resource;
      }
    }

    // Validasi required parameters
    if (!game || !version || !user_key || !serial || !resource) {
      return res.status(400).json({
        status: false,
        reason: "Missing required parameters"
      });
    }

    // Validasi game harus MLBB
    if (game !== 'MLBB') {
      return res.status(400).json({
        status: false,
        reason: "Invalid game"
      });
    }

    // Check if user_key is registered
    if (!data.keys.includes(user_key)) {
      console.log(`Key not registered: ${user_key}`);
      return res.status(200).json({
        status: false,
        reason: "MEMBER KEY NOT REGISTERED"
      });
    }

    // Cek device
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

    // 🔥 Generate token 32 karakter (hex only)
    const token = generateToken(resource, serial);
    const rng = Math.floor(Math.random() * 2000000000) + 1000000000;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
    
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const expired = new Date(now.getTime() + 3600000);
    const expiredStr = expired.toISOString().replace('T', ' ').slice(0, 19);

    // 🔥 Simpan device
    data.devices[user_key] = {
      serial: serial,
      datte: `${dateStr} ${timeStr}`,
      expired: expiredStr
    };

    console.log(`[LOG] Token: ${token}`);
    console.log(`[LOG] Device saved for ${user_key}`);

    // 🔥 Tambahkan session ID ke response (buat libclient.so)
    const newSessionId = generateSessionId();
    data.sessions[newSessionId] = {
      created: new Date().toISOString(),
      last_used: new Date().toISOString(),
      user_key: user_key
    };

    const response = {
      status: true,
      data: {
        Datte: `${dateStr} ${timeStr}`,
        token: token,
        rng: rng,
        tittle: "kyvrennn",
        versi: version,
        instance: "Instance",
        expired: expiredStr,
        session_id: newSessionId  // 🔥 Tambahkan session_id
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

  // ============================================================
  // 🔥 ROUTING: /MLBB
  // ============================================================
  if (req.url === '/MLBB' || req.url.startsWith('/MLBB?')) {
    let game, version, user_key, serial, resource;

    if (req.method === 'GET') {
      game = req.query.game;
      version = req.query.version;
      user_key = req.query.user_key;
      serial = req.query.serial;
      resource = req.query.resource;
    } else {
      if (req.body && Object.keys(req.body).length > 0) {
        game = req.body.game;
        version = req.body.version;
        user_key = req.body.user_key;
        serial = req.body.serial;
        resource = req.body.resource;
      }
      
      if (!game || !version || !user_key || !serial || !resource) {
        game = req.query.game;
        version = req.query.version;
        user_key = req.query.user_key;
        serial = req.query.serial;
        resource = req.query.resource;
      }
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
      console.log(`Key not registered: ${user_key}`);
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

    const token = generateToken(resource, serial);
    const rng = Math.floor(Math.random() * 2000000000) + 1000000000;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
    
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const expired = new Date(now.getTime() + 3600000);
    const expiredStr = expired.toISOString().replace('T', ' ').slice(0, 19);

    data.devices[user_key] = {
      serial: serial,
      datte: `${dateStr} ${timeStr}`,
      expired: expiredStr
    };

    console.log(`[LOG] Token: ${token}`);
    console.log(`[LOG] Device saved for ${user_key}`);

    const response = {
      status: true,
      data: {
        Datte: `${dateStr} ${timeStr}`,
        token: token,
        rng: rng,
        tittle: "kyvrennn",
        versi: version,
        instance: "Instance",
        expired: expiredStr
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
