const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

router.get('/topics', async (req, res) => {
  try {
    const [topics] = await pool.query('SELECT id, title, order_num FROM theory_topics ORDER BY order_num');
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [topics] = await pool.query('SELECT * FROM theory_topics WHERE id = ?', [req.params.id]);
    if (topics.length === 0) return res.status(404).json({ error: 'Тема не найдена' });
    res.json({ topic: topics[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id/mini-test', async (req, res) => {
  try {
    const [questions] = await pool.query('SELECT * FROM mini_tests WHERE topic_id = ?', [req.params.id]);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, short_content, file_path } = req.body;
    await pool.query('UPDATE theory_topics SET title = ?, short_content = ?, file_path = ? WHERE id = ?',
      [title, short_content, file_path || null, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
