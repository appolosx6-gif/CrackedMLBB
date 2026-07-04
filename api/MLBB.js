// 🔥 DATA KOSONG (keys & devices)
let data = {
  keys: [],      // ← KOSONG! Tidak ada default key
  devices: {}    // ← KOSONG! Akan terisi saat ada yang daftar
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

// Generate random key
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PINOKCRACK_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate token
function generateToken(resource, serial) {
  const baseString = `${resource}|${serial}|${Date.now()}`;
  
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  return `${hexHash}${randomPart}`.substring(0, 32);
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
  // 🔥 ROUTING: /api/admin/keys (GET = lihat keys, POST = generate)
  // ============================================================
  if (req.url === '/api/admin/keys') {
    // GET - Ambil semua keys
    if (req.method === 'GET') {
      return res.status(200).json({
        status: true,
        data: data.keys
      });
    }

    // POST - Generate key baru
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

    // DELETE - Hapus key
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

    // PUT - Update expired
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
  // 🔥 ROUTING: /api/admin/devices (GET = lihat devices)
  // ============================================================
  if (req.url === '/api/admin/devices' && req.method === 'GET') {
    return res.status(200).json({
      status: true,
      data: data.devices
    });
  }

  // ============================================================
  // 🔥 ROUTING: /MLBB (API Utama - GET & POST)
  // ============================================================
  if (req.url === '/MLBB' || req.url.startsWith('/MLBB?')) {
    // Ambil parameter dari query atau body
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

    // Generate token
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

    // 🔥 SIMPAN DEVICE (baru pertama kali)
    data.devices[user_key] = {
      serial: serial,
      datte: `${dateStr} ${timeStr}`,
      expired: expiredStr
    };

    console.log(`[LOG] Device saved for ${user_key}:`, data.devices[user_key]);

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

  // ============================================================
  // 🔥 ROUTING: DEFAULT - 404
  // ============================================================
  return res.status(404).json({
    status: false,
    reason: "Not Found"
  });
}