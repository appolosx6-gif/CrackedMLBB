// 🔥 DATA DI MEMORY
const ADMIN_USERNAME = 'pino';
const ADMIN_PASSWORD = 'pinoganteng123';

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