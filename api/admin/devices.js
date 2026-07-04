import fs from 'fs';
import path from 'path';

const DEVICES_PATH = path.join(process.cwd(), 'devices.json');

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      status: false,
      reason: "Method Not Allowed"
    });
  }

  try {
    if (fs.existsSync(DEVICES_PATH)) {
      const fileContent = fs.readFileSync(DEVICES_PATH, 'utf8');
      const devicesData = JSON.parse(fileContent);
      return res.status(200).json({
        status: true,
        data: devicesData
      });
    } else {
      return res.status(200).json({
        status: true,
        data: {}
      });
    }
  } catch (error) {
    console.error('Error reading devices.json:', error);
    return res.status(500).json({
      status: false,
      reason: "Error reading devices data"
    });
  }
}