// db.js — MySQL connection pool for HotelEase

const mysql = require('mysql2/promise');
const path  = require('path');

// Load environment variables from .env if present
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotelease',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

