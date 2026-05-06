const express = require('express');
const router = express.Router();
const pool = require('../database/pool');

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      db: 'connected',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: err.message,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      code: err.code
    });
  }
});

module.exports = router;