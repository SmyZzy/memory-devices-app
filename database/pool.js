const mysql = require('mysql2/promise');
require('dotenv').config();

const caCert = `-----BEGIN CERTIFICATE-----
MIIERDCCAqygAwIBAgIUT/0t4XrXZQp2sDENRcwH7NwQ8x0wDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvOWQ0NDg4MjctMDdkMy00NzU5LWEwYzctYjBjNDY0ODAx
MmExIFByb2plY3QgQ0EgUmlnaHQgQXRlbGllciBBbXIgaW4gRmlubGFuZAJBgNVBAYT
AkZpMQswCQYDVQQDDAI1ZDQ0ODgyNy0wN2QzLTQ3NTktYTBjNy1iMGM0NjQ4MDEyYTEg
-----END CERTIFICATE-----`;

const sslConfig = process.env.DB_SSL === 'true' ? {
  ca: caCert,
  rejectUnauthorized: true
} : null;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'memory_devices_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: sslConfig
});

module.exports = pool;
