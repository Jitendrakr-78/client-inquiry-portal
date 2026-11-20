require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'inquiries.json');

// Ensure data folder/file exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  console.log('Looking for file at:', filePath);
  res.sendFile(filePath);
});
// Create a new inquiry
app.post('/api/inquiries', (req, res) => {
  const { name, email, service, details } = req.body;

  if (!name || !email || !service) {
    return res.status(400).json({ error: 'Name, email, and service are required.' });
  }

  const inquiries = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const newInquiry = {
    id: `REQ-${1000 + inquiries.length + 1}`,
    name: name.trim(),
    email: email.trim(),
    service,
    details: details ? details.trim() : '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  inquiries.push(newInquiry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(inquiries, null, 2));

  res.status(201).json({
    message: 'Request received successfully!',
    referenceId: newInquiry.id
  });
});

// Protected admin view (pass ?key=YOUR_ADMIN_KEY)
app.get('/api/inquiries', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || 'demo123';
  if (req.query.key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const inquiries = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(inquiries);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
