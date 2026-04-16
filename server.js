/**
 * server.js — HotelEase Express Application (MVC + OOP wiring)
 */

const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// ── View Engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ── Static Assets ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded form submissions from Pug forms.
app.use(express.urlencoded({ extended: true }));

// ── Sessions ──────────────────────────────────────────────────────────────────
app.use(
  session({
    name: 'hotelease.sid',
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// ── Model / Controllers ────────────────────────────────────────────────────────
const pool = require('./db');

const HotelModel = require('./models/hotelModel');
const UserModel = require('./models/userModel');
const HotelController = require('./controllers/hotelController');
const AuthController = require('./controllers/authController');
const DashboardController = require('./controllers/dashboardController');
const DisputeController = require('./controllers/controllers/DisputeController');
//Reviews
const ReviewModel      = require('./models/reviewModel');

const hotelModel = new HotelModel({ pool });
const reviewModel = new ReviewModel({ pool });
const userModel = new UserModel({ db: pool });
const hotelController = new HotelController({ hotelModel, reviewModel, db: pool });
const authController = new AuthController({ userModel });
const dashboardController = new DashboardController({ db: pool, userModel });
const disputeController = new DisputeController();

// ── Routes (modules) ───────────────────────────────────────────────────────────
app.use('/', require('./routes/hotelRoutes')(hotelController));
app.use('/', require('./routes/authRoutes')(authController));
app.use('/', require('./routes/dashboardRoutes')(dashboardController));
app.use('/', require('./routes/disputeRoutes')(disputeController));


// ── Error Handling ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('500 Server Error');
});

// ── Start ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    // Ensure DB tables/data exist before serving requests.
    await hotelModel.init();
  } catch (err) {
    // Model falls back to in-memory dummy data if DB is unavailable.
    console.error('Failed to initialize hotel model:', err);
  }

  app.listen(PORT, () => {
    console.log(`HotelEase running → http://localhost:${PORT}`);
  });
})();
