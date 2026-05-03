const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

router.get('/full', async (req, res) => {
  try {
    const [questions] = await pool.query('SELECT id, question, option_a, option_b, option_c, option_d FROM full_tests ORDER BY RAND()');
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/full/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const questionIds = Object.keys(answers);
    let score = 0;

    for (const qId of questionIds) {
      const [questions] = await pool.query('SELECT correct_answer FROM full_tests WHERE id = ?', [qId]);
      if (questions.length > 0 && questions[0].correct_answer === answers[qId]) {
        score++;
      }
    }

    const total = questionIds.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;

    await pool.query(
      'INSERT INTO test_results (user_id, score, total_questions, percentage, test_type) VALUES (?, ?, ?, ?, \'full\')',
      [userId, score, total, percentage]
    );

    res.json({ score, total, percentage });
  } catch (err) {
    console.error('Full test submit error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/mini/submit', async (req, res) => {
  try {
    const { topicId, answers } = req.body;
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });

    const questionIds = Object.keys(answers);
    let score = 0;

    for (const qId of questionIds) {
      const [questions] = await pool.query('SELECT correct_answer FROM mini_tests WHERE id = ?', [qId]);
      if (questions.length > 0 && questions[0].correct_answer === answers[qId]) {
        score++;
      }
    }

    const total = questionIds.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;

    await pool.query(
      'INSERT INTO test_results (user_id, score, total_questions, percentage, test_type, topic_id) VALUES (?, ?, ?, ?, \'mini\', ?)',
      [userId, score, total, percentage, topicId]
    );

    res.json({ score, total, percentage });
  } catch (err) {
    console.error('Mini test submit error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
