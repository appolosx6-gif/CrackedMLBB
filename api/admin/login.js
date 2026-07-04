import fs from 'fs';
import path from 'path';

// PAKAI /tmp (BISA WRITE)
const DATA_DIR = '/tmp';
const ADMIN_PATH = path.join(DATA_DIR, 'admin.json');

const ADMIN_USERNAME = 'owner';
const ADMIN_PASSWORD = 'pinoganteng123';

function getAdminData() {
  try {
    // Cek apakah file ada
    if (!fs.existsSync(ADMIN_PATH)) {
      // Buat default admin
      const defaultAdmin = {
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      };
      fs.writeFileSync(ADMIN_PATH, JSON.stringify(defaultAdmin, null, 2));
      return defaultAdmin;
    }
    const fileContent = fs.readFileSync(ADMIN_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading admin.json:', error);
    // Fallback ke default
    return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: false, 
      reason: "Method Not Allowed" 
    });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: false,
      reason: "Username and password required"
    });
  }

  const admin = getAdminData();

  if (admin.username !== username || admin.password !== password) {
    return res.status(200).json({
      status: false,
      reason: "Invalid username or password"
    });
  }

  return res.status(200).json({
    status: true,
    data: {
      username: admin.username,
      session: Date.now().toString(36) + Math.random().toString(36).substring(2)
    }
  });
}