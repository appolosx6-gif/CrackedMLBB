import fs from 'fs';
import path from 'path';

// PAKAI /tmp (BISA WRITE)
const DATA_DIR = '/tmp';
const REGISTER_PATH = path.join(DATA_DIR, 'register.txt');
const DEVICES_PATH = path.join(DATA_DIR, 'devices.json');

// Fungsi untuk membaca daftar user_key
function getRegisteredKeys() {
  try {
    if (!fs.existsSync(REGISTER_PATH)) {
      fs.writeFileSync(REGISTER_PATH, '');
      return [];
    }
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      status: false, 
      reason: "Method Not Allowed" 
    });
  }

  const { game, version, user_key, serial, resource } = req.query;

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

  const registeredKeys = getRegisteredKeys();
  
  if (!registeredKeys.includes(user_key)) {
    return res.status(200).json({
      status: false,
      reason: "MEMBER KEY NOT REGISTERED"
    });
  }

  let devicesData = getDevicesData();

  if (devicesData[user_key]) {
    const existingDevice = devicesData[user_key];
    
    if (isExpired(existingDevice.expired)) {
      delete devicesData[user_key];
      saveDevicesData(devicesData);
    } else {
      if (existingDevice.serial !== serial) {
        return res.status(200).json({
          status: false,
          reason: "DEVICE LIMIT IS OUT"
        });
      }
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