require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Completed', 'Rejected'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let pool;

function isAuthorized(req) {
  const adminKey = process.env.ADMIN_KEY || 'demo123';
  const providedKey = req.query.key || req.headers['x-admin-key'];
  return providedKey === adminKey;
}

async function initDatabase() {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id VARCHAR(30) PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL,
      service VARCHAR(160) NOT NULL,
      details TEXT,
      status ENUM('Pending', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log('Connected to Clever Cloud MySQL');
}

// Create a new inquiry
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, service, details } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({ error: 'Name, email, and service are required.' });
    }

    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM inquiries');
    const nextNum = 1000 + Number(rows[0].total) + 1;
    const referenceId = `REQ-${nextNum}`;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanService = service.trim();
    const cleanDetails = details ? details.trim() : '';

    await pool.execute(
      `INSERT INTO inquiries (id, name, email, service, details, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [referenceId, cleanName, cleanEmail, cleanService, cleanDetails]
    );

    res.status(201).json({
      message: 'Request received successfully!',
      referenceId,
      status: 'Pending'
    });
  } catch (err) {
    console.error('Create inquiry error:', err);
    res.status(500).json({ error: 'Failed to save inquiry.' });
  }
});

// Protected admin view: list all inquiries
app.get('/api/inquiries', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, service, details, status, created_at, updated_at FROM inquiries ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch inquiries error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries.' });
  }
});

// Protected admin action: update inquiry status
app.patch('/api/inquiries/:id/status', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { status } = req.body;
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE inquiries SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    const [updatedRows] = await pool.execute(
      'SELECT id, name, email, service, details, status, created_at, updated_at FROM inquiries WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Status updated successfully.',
      inquiry: updatedRows[0]
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MySQL connection error:', err);
    process.exit(1);
  });