const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const bcrypt = require('bcryptjs');

router.get('/profile', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const [users] = await pool.query(
      'SELECT u.id, u.username, u.first_name, u.last_name, u.middle_name, u.created_at, g.name as group_name FROM users u LEFT JOIN \`groups\` g ON u.group_id = g.id WHERE u.id = ?',
      [userId]
    );

    if (users.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const { first_name, last_name, middle_name } = req.body;
    await pool.query('UPDATE users SET first_name = ?, last_name = ?, middle_name = ? WHERE id = ?',
      [first_name, last_name, middle_name, userId]);

    req.session.user.first_name = first_name;
    req.session.user.last_name = last_name;
    req.session.user.middle_name = middle_name;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const { current_password, new_password } = req.body;

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 8 символов' });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const match = await bcrypt.compare(current_password, users[0].password);

    if (!match) return res.status(401).json({ error: 'Текущий пароль неверен' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/results', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const [results] = await pool.query(
      'SELECT tr.*, tt.title as topic_title FROM test_results tr LEFT JOIN theory_topics tt ON tr.topic_id = tt.id WHERE tr.user_id = ? ORDER BY tr.completed_at DESC',
      [userId]
    );

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
