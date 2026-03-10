const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// ── View Engine ──────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parser ──────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ──────────────────────────────────────────────────
app.use(session({
  secret: 'hotelease-secret-key',
  resave: false,
  saveUninitialized: false
}));

// ── Database Connection ───────────────────────────────────────
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin#786',
  database: 'hotelease'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL database!');
});

// ── Middleware: pass user to all views ────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ── HOME PAGE ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  const city = req.query.city || '';
  let query = 'SELECT * FROM hotels';
  let params = [];

  if (city) {
    query += ' WHERE city = ?';
    params.push(city);
  }

  db.query(query, params, (err, hotels) => {
    if (err) throw err;
    res.render('index', {
      title: 'HotelEase — Find Your Perfect Stay',
      hotels: hotels,
      selectedCity: city
    });
  });
});

// ── HOTEL DETAIL PAGE ─────────────────────────────────────────
app.get('/hotel/:id', (req, res) => {
  db.query('SELECT * FROM hotels WHERE id = ?', [req.params.id], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.redirect('/');
    res.render('hotel', {
      title: results[0].name,
      hotel: results[0]
    });
  });
});

// ── BOOKING PAGE ──────────────────────────────────────────────
app.get('/book/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  db.query('SELECT * FROM hotels WHERE id = ?', [req.params.id], (err, results) => {
    if (err) throw err;
    res.render('booking', {
      title: 'Book ' + results[0].name,
      hotel: results[0]
    });
  });
});

app.post('/book/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { checkin_date, checkout_date } = req.body;
  const user_id = req.session.user.id;
  const hotel_id = req.params.id;

  db.query(
    'INSERT INTO bookings (user_id, hotel_id, checkin_date, checkout_date) VALUES (?, ?, ?, ?)',
    [user_id, hotel_id, checkin_date, checkout_date],
    (err) => {
      if (err) throw err;
      res.redirect('/confirmation');
    }
  );
});

// ── CONFIRMATION PAGE ─────────────────────────────────────────
app.get('/confirmation', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('confirmation', { title: 'Booking Confirmed!' });
});

// ── REGISTER ──────────────────────────────────────────────────
app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed],
    (err) => {
      if (err) {
        return res.render('register', {
          title: 'Register',
          error: 'Email already exists. Please use a different email.'
        });
      }
      res.redirect('/login');
    }
  );
});

// ── LOGIN ─────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.render('login', {
        title: 'Login',
        error: 'No account found with that email.'
      });
    }

    const match = await bcrypt.compare(password, results[0].password);
    if (!match) {
      return res.render('login', {
        title: 'Login',
        error: 'Incorrect password. Please try again.'
      });
    }

    req.session.user = results[0];
    res.redirect('/');
  });
});

// ── LOGOUT ────────────────────────────────────────────────────
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ── START SERVER ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ HotelEase running → http://localhost:${PORT}`);
});