// 🔥 DATA DI MEMORY - REGISTERED KEYS KOSONG
let registeredKeys = [];
let devicesData = {};

// Generate random key dengan awalan PINOKCRACK_
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PINOKCRACK_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Ambil semua keys
  if (req.method === 'GET') {
    return res.status(200).json({
      status: true,
      data: registeredKeys
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
      } while (registeredKeys.includes(newKey) && attempts < 100);
      
      if (!registeredKeys.includes(newKey)) {
        registeredKeys.push(newKey);
        newKeys.push(newKey);
      }
    }

    return res.status(200).json({
      status: true,
      data: {
        message: `${newKeys.length} key(s) generated successfully`,
        keys: newKeys,
        total: registeredKeys.length
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

    if (!registeredKeys.includes(key)) {
      return res.status(200).json({
        status: false,
        reason: "Key not found"
      });
    }

    registeredKeys = registeredKeys.filter(k => k !== key);

    return res.status(200).json({
      status: true,
      data: {
        message: "Key deleted successfully",
        key: key,
        total: registeredKeys.length
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

    if (!devicesData[key]) {
      return res.status(200).json({
        status: false,
        reason: "Key not found in devices"
      });
    }

    devicesData[key].expired = expired;

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