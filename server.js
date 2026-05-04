/**
 * Точка входа приложения: запуск сервера, подключение middleware, маршрутов и статики
 */
const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config(); // Загрузка переменных окружения из .env

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'public', 'files')));

// Настройка сессий (через express-session): хранение состояния входа пользователя
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret', // Секрет для подписи cookie (из .env)
  resave: false,       // Не сохранять сессию, если не было изменений
  saveUninitialized: false, // Не сохранять пустые сессии
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // Срок жизни cookie: 24 часа
}));

const authRoutes = require('./routes/auth');
const theoryRoutes = require('./routes/theory');
const testRoutes = require('./routes/test');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');

app.use('/api/auth', authRoutes);
app.use('/api/theory', theoryRoutes);
app.use('/api/test', testRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/main', (req, res) => res.sendFile(path.join(__dirname, 'public', 'main.html')));
app.get('/main.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'main.html')));
app.get('/theory', (req, res) => res.sendFile(path.join(__dirname, 'public', 'theory.html')));
app.get('/theory.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'theory.html')));
app.get('/theory-detail.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'theory-detail.html')));
app.get('/test', (req, res) => res.sendFile(path.join(__dirname, 'public', 'test.html')));
app.get('/test.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'test.html')));
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student.html')));
app.get('/student.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student.html')));
app.get('/teacher', (req, res) => res.sendFile(path.join(__dirname, 'public', 'teacher.html')));
app.get('/teacher.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'teacher.html')));

// Глобальный обработчик ошибок (чтобы вместо HTML возвращать JSON)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
