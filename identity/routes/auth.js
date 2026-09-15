const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateToken, authMiddleware, JWT_ISSUER } = require('@sih/shared/auth');

function createAuthRoutes(db) {
  const router = express.Router();

  // POST /auth/register
  router.post('/register', authMiddleware({ optional: true }), async (req, res) => {
    try {
      const { username, password, name, email, mobile, role, department } = req.body;
      
      // Basic validation
      if (!username || !password || !name || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if trying to register admin/dept_official
      if (role !== 'citizen') {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can register non-citizen users' });
        }
      }

      // Check if username exists
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const id = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO users (id, username, password_hash, name, email, mobile, role, department, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `);

      stmt.run(id, username, passwordHash, name, email || null, mobile || null, role, department || null, now);

      res.status(201).json({ message: 'User registered successfully', userId: id });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: [user.role],
        department: user.department,
        iss: JWT_ISSUER || 'sih-26129-identity-service'
      };

      const access_token = generateToken(payload);

      res.json({
        access_token,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          sub: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /auth/userinfo
  router.get('/userinfo', authMiddleware(), (req, res) => {
    const user = db.prepare('SELECT id as sub, name, email, role, department FROM users WHERE id = ?').get(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });

  // GET /auth/token/verify
  router.get('/token/verify', authMiddleware(), (req, res) => {
    res.json({ valid: true, payload: req.user });
  });

  return router;
}

module.exports = { createAuthRoutes };
