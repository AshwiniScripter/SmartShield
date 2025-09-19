// server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // MySQL
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // replace with your MySQL username
  password: '1234',  // replace with your MySQL password
  database: 'smartshield',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper: Log a request (simulate)
async function logRequest(ip) {
  const now = new Date();

  // Insert request
  await pool.query(
    `INSERT INTO requests(ip_address, request_time) VALUES (?, ?)`,
    [ip, now]
  );

  // Count requests in last 1 minute
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM requests WHERE ip_address = ? AND request_time > (NOW() - INTERVAL 1 MINUTE)`,
    [ip]
  );

  const count = rows[0].count;

  // If more than 10 requests in last minute, mark as suspicious
  if (count > 10) {
    await pool.query(
      `INSERT INTO suspicious_ips(ip_address, request_count, last_request)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE request_count = ?, last_request = ?`,
      [ip, count, now, count, now]
    );

    // If more than 20 requests, block
    if (count > 20) {
      await pool.query(
        `INSERT INTO blocked_ips(ip_address, blocked_at)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE blocked_at = blocked_at`, // keep original block time
        [ip, now]
      );
    }
  }
}

// Simulate requests from random IPs every 5 sec
setInterval(() => {
  const randomIP = `192.168.0.${Math.floor(Math.random() * 50 + 1)}`;
  logRequest(randomIP);
}, 5000);

// APIs for frontend

// Total requests
app.get('/api/requests', async (req, res) => {
  const [rows] = await pool.query(`SELECT COUNT(*) as count FROM requests`);
  res.json({ totalRequests: rows[0].count });
});

// Total suspicious IPs
app.get('/api/suspicious', async (req, res) => {
  const [rows] = await pool.query(`SELECT COUNT(*) as count FROM suspicious_ips`);
  res.json({ suspiciousIPs: rows[0].count });
});

// Total blocked IPs
app.get('/api/blocked', async (req, res) => {
  const [rows] = await pool.query(`SELECT COUNT(*) as count FROM blocked_ips`);
  res.json({ blockedIPs: rows[0].count });
});

// List of suspicious IPs
app.get('/api/suspicious-ips', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT ip_address, request_count, last_request
    FROM suspicious_ips
    ORDER BY last_request DESC
  `);
  res.json(rows);
});

// List of blocked IPs
app.get('/api/blocked-ips', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT ip_address, blocked_at
    FROM blocked_ips
    ORDER BY blocked_at DESC
  `);
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
