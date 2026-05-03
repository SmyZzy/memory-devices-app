const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database/pool');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      group_id: user.group_id
    };

    res.json({ success: true, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, first_name, last_name, middle_name, group_id } = req.body;

    if (!username || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Заполните обязательные поля (логин, пароль, имя, фамилия)' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
    }

    const trimmed = username.trim();
    if (trimmed.length < 2) {
      return res.status(400).json({ error: 'Логин должен содержать минимум 2 символа' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [trimmed]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const groupId = group_id && !isNaN(parseInt(group_id)) ? parseInt(group_id) : null;

    await pool.query(
      'INSERT INTO users (username, password, role, first_name, last_name, middle_name, group_id) VALUES (?, ?, \'student\', ?, ?, ?, ?)',
      [trimmed, hashed, last_name.trim(), first_name.trim(), middle_name ? middle_name.trim() : null, groupId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Ошибка выхода' });
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  res.json({ user: req.session.user });
});

router.get('/groups', async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT id, name FROM `groups` ORDER BY name');
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
