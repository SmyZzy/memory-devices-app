const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function checkTeacher(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}

router.use(checkTeacher);

router.get('/profile', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, first_name, last_name, middle_name, created_at FROM users WHERE id = ?',
      [req.session.user.id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { first_name, last_name, middle_name } = req.body;
    await pool.query('UPDATE users SET first_name = ?, last_name = ?, middle_name = ? WHERE id = ?',
      [first_name, last_name, middle_name, req.session.user.id]);
    req.session.user.first_name = first_name;
    req.session.user.last_name = last_name;
    req.session.user.middle_name = middle_name;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const { group_id, sort_by = 'completed_at', sort_order = 'DESC' } = req.query;

    let sql = `
      SELECT tr.id, u.first_name, u.last_name, u.middle_name, u.username, g.name as group_name,
             tr.score, tr.total_questions, tr.percentage, tr.test_type, tt.title as topic_title,
             tr.started_at, tr.completed_at
      FROM test_results tr
      JOIN users u ON tr.user_id = u.id
      LEFT JOIN \`groups\` g ON u.group_id = g.id
      LEFT JOIN theory_topics tt ON tr.topic_id = tt.id
    `;

    const params = [];
    if (group_id) {
      sql += ' WHERE u.group_id = ?';
      params.push(group_id);
    }

    const allowedSort = ['completed_at', 'percentage', 'score', 'group_name'];
    const orderBy = allowedSort.includes(sort_by) ? sort_by : 'completed_at';
    const orderDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${orderBy} ${orderDir}`;

    const [results] = await pool.query(sql, params);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT * FROM \`groups\` ORDER BY name');
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT u.id, u.username, u.first_name, u.last_name, u.middle_name, g.name as group_name FROM users u LEFT JOIN \`groups\` g ON u.group_id = g.id WHERE u.role = \'student\' ORDER BY g.name, u.last_name'
    );
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/generate-accounts', async (req, res) => {
  try {
    const { group_id, count, password_prefix = 'stud' } = req.body;

    if (!group_id || !count || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Укажите группу и количество (1-100)' });
    }

    const [groupExists] = await pool.query('SELECT id, name FROM \`groups\` WHERE id = ?', [group_id]);
    if (groupExists.length === 0) return res.status(404).json({ error: 'Группа не найдена' });

    const generated = [];
    const usedUsernames = new Set();

    const [existingUsers] = await pool.query('SELECT username FROM users');
    existingUsers.forEach(u => usedUsernames.add(u.username));

    for (let i = 0; i < count; i++) {
      let username;
      do {
        const rand = crypto.randomBytes(3).toString('hex');
        username = `${password_prefix}_${groupExists[0].name.toLowerCase()}_${rand}`;
      } while (usedUsernames.has(username));

      usedUsernames.add(username);
      const password = crypto.randomBytes(4).toString('hex');
      const hashed = await bcrypt.hash(password, 10);

      await pool.query(
        'INSERT INTO users (username, password, role, group_id) VALUES (?, ?, \'student\', ?)',
        [username, hashed, group_id]
      );

      generated.push({ username, password });
    }

    res.json({ generated });
  } catch (err) {
    console.error('Generate accounts error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/account/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ? AND role = \'student\'', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/theory-topics', async (req, res) => {
  try {
    const [topics] = await pool.query('SELECT * FROM theory_topics ORDER BY order_num');
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/theory-topics/:id', async (req, res) => {
  try {
    const { title, short_content, file_path } = req.body;
    await pool.query('UPDATE theory_topics SET title = ?, short_content = ?, file_path = ? WHERE id = ?',
      [title, short_content, file_path || null, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/mini-tests', async (req, res) => {
  try {
    const [questions] = await pool.query('SELECT * FROM mini_tests ORDER BY topic_id, id');
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/mini-tests/:topicId', async (req, res) => {
  try {
    const [questions] = await pool.query('SELECT * FROM mini_tests WHERE topic_id = ? ORDER BY id', [req.params.topicId]);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/mini-tests', async (req, res) => {
  try {
    const { topic_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    await pool.query(
      'INSERT INTO mini_tests (topic_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [topic_id, question, option_a, option_b, option_c, option_d, correct_answer]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/mini-tests/:id', async (req, res) => {
  try {
    const { question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    await pool.query(
      'UPDATE mini_tests SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ? WHERE id = ?',
      [question, option_a, option_b, option_c, option_d, correct_answer, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/mini-tests/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM mini_tests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/full-tests', async (req, res) => {
  try {
    const [questions] = await pool.query('SELECT * FROM full_tests ORDER BY id');
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/full-tests', async (req, res) => {
  try {
    const { question, option_a, option_b, option_c, option_d, correct_answer, topic_id } = req.body;
    await pool.query(
      'INSERT INTO full_tests (question, option_a, option_b, option_c, option_d, correct_answer, topic_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [question, option_a, option_b, option_c, option_d, correct_answer, topic_id || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/full-tests/:id', async (req, res) => {
  try {
    const { question, option_a, option_b, option_c, option_d, correct_answer, topic_id } = req.body;
    await pool.query(
      'UPDATE full_tests SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, topic_id = ? WHERE id = ?',
      [question, option_a, option_b, option_c, option_d, correct_answer, topic_id || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/full-tests/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM full_tests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
