import fs from 'fs';
import path from 'path';

const REGISTER_PATH = path.join(process.cwd(), 'register.txt');
const DEVICES_PATH = path.join(process.cwd(), 'devices.json');

// Fungsi untuk membaca daftar user_key
function getRegisteredKeys() {
  try {
    const fileContent = fs.readFileSync(REGISTER_PATH, 'utf8');
    return fileContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error('Error reading register.txt:', error);
    return [];
  }
}

// Fungsi untuk menyimpan daftar user_key
function saveRegisteredKeys(keys) {
  try {
    fs.writeFileSync(REGISTER_PATH, keys.join('\n'), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving register.txt:', error);
    return false;
  }
}

// Generate random key dengan awalan PINOKCRACK_
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PINOKCRACK_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fungsi untuk membaca data devices
function getDevicesData() {
  try {
    if (fs.existsSync(DEVICES_PATH)) {
      const fileContent = fs.readFileSync(DEVICES_PATH, 'utf8');
      return JSON.parse(fileContent);
    }
    return {};
  } catch (error) {
    console.error('Error reading devices.json:', error);
    return {};
  }
}

// Fungsi untuk menyimpan data devices
function saveDevicesData(data) {
  try {
    fs.writeFileSync(DEVICES_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving devices.json:', error);
    return false;
  }
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
    const keys = getRegisteredKeys();
    return res.status(200).json({
      status: true,
      data: keys
    });
  }

  // POST - Generate key baru
  if (req.method === 'POST') {
    const { count = 1 } = req.body;
    
    const keys = getRegisteredKeys();
    const newKeys = [];

    for (let i = 0; i < count; i++) {
      let newKey;
      let attempts = 0;
      do {
        newKey = generateKey();
        attempts++;
      } while (keys.includes(newKey) && attempts < 100);
      
      if (!keys.includes(newKey)) {
        keys.push(newKey);
        newKeys.push(newKey);
      }
    }

    saveRegisteredKeys(keys);

    return res.status(200).json({
      status: true,
      data: {
        message: `${newKeys.length} key(s) generated successfully`,
        keys: newKeys,
        total: keys.length
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

    let keys = getRegisteredKeys();
    
    if (!keys.includes(key)) {
      return res.status(200).json({
        status: false,
        reason: "Key not found"
      });
    }

    keys = keys.filter(k => k !== key);
    saveRegisteredKeys(keys);

    return res.status(200).json({
      status: true,
      data: {
        message: "Key deleted successfully",
        key: key,
        total: keys.length
      }
    });
  }

  // PUT - Update expired untuk key
  if (req.method === 'PUT') {
    const { key, expired } = req.body;
    
    if (!key || !expired) {
      return res.status(400).json({
        status: false,
        reason: "Key and expired date are required"
      });
    }

    let devicesData = getDevicesData();

    if (!devicesData[key]) {
      return res.status(200).json({
        status: false,
        reason: "Key not found in devices"
      });
    }

    devicesData[key].expired = expired;
    saveDevicesData(devicesData);

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