import fs from 'fs';
import path from 'path';

// Path untuk file-file
const REGISTER_PATH = path.join(process.cwd(), 'register.txt');
const DEVICES_PATH = path.join(process.cwd(), 'devices.json');

// Fungsi untuk membaca daftar user_key terdaftar
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

// Fungsi cek expired
function isExpired(expiredDate) {
  if (!expiredDate) return false;
  const now = new Date();
  const expired = new Date(expiredDate);
  return now > expired;
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      status: false, 
      reason: "Method Not Allowed" 
    });
  }

  // Get query parameters
  const { game, version, user_key, serial, resource } = req.query;

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

  // Baca daftar user_key dari register.txt
  const registeredKeys = getRegisteredKeys();
  
  // Check if user_key is registered
  if (!registeredKeys.includes(user_key)) {
    return res.status(200).json({
      status: false,
      reason: "MEMBER KEY NOT REGISTERED"
    });
  }

  // Baca data devices
  const devicesData = getDevicesData();

  // Cek apakah user_key sudah memiliki device
  if (devicesData[user_key]) {
    const existingDevice = devicesData[user_key];
    
    // Cek expired
    if (isExpired(existingDevice.expired)) {
      console.log(`[LOG] Device expired for ${user_key}, allowing new device...`);
      delete devicesData[user_key];
      saveDevicesData(devicesData);
    } else {
      if (existingDevice.serial !== serial) {
        console.log(`[LOG] Device limit reached for ${user_key}. Serial: ${serial} not match with ${existingDevice.serial}`);
        return res.status(200).json({
          status: false,
          reason: "DEVICE LIMIT IS OUT"
        });
      }
      saveDevicesData(devicesData);
      console.log(`[LOG] Device updated for ${user_key}. Serial: ${serial}`);
    }
  }

  // Generate token
  const generateToken = (resource, serial) => {
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
  };

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

  // Simpan atau update device
  devicesData[user_key] = {
    serial: serial,
    datte: `${dateStr} ${timeStr}`,
    expired: expiredStr
  };
  saveDevicesData(devicesData);

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