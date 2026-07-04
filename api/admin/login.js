import fs from 'fs';
import path from 'path';

const ADMIN_PATH = path.join(process.cwd(), 'admin.json');

// DATA ADMIN - Username & Password (bisa diubah di sini)
const ADMIN_USERNAME = 'pino';
const ADMIN_PASSWORD = 'pinoganteng123';

// Fungsi untuk membaca atau membuat admin.json
function getAdminData() {
  try {
    if (fs.existsSync(ADMIN_PATH)) {
      const fileContent = fs.readFileSync(ADMIN_PATH, 'utf8');
      return JSON.parse(fileContent);
    }
    // Buat file admin.json jika belum ada
    const defaultAdmin = {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    };
    fs.writeFileSync(ADMIN_PATH, JSON.stringify(defaultAdmin, null, 2));
    return defaultAdmin;
  } catch (error) {
    console.error('Error reading admin.json:', error);
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
  
  // Cek username & password (plain text)
  if (admin.username !== username || admin.password !== password) {
    return res.status(200).json({
      status: false,
      reason: "Invalid username or password"
    });
  }

  // Login sukses
  return res.status(200).json({
    status: true,
    data: {
      username: admin.username,
      session: Date.now().toString(36) + Math.random().toString(36).substring(2)
    }
  });
}