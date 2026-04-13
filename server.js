/**
 * server.js — HotelEase Express Application (MVC + OOP wiring)
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── View Engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ── Static Assets ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Model / Controllers ────────────────────────────────────────────────────────
const pool = require('./db'); // currently unused by the demo model, but wired for later

const HotelModel = require('./models/hotelModel');
const HotelController = require('./controllers/hotelController');
const AuthController = require('./controllers/authController');
const DisputeController = require('./controllers/controllers/DisputeController');

const hotelModel = new HotelModel({ pool });
const hotelController = new HotelController({ hotelModel });
const authController = new AuthController();
const disputeController = new DisputeController();

// Parse URL-encoded form submissions from Pug forms.
app.use(express.urlencoded({ extended: true }));

// ── Routes (modules) ───────────────────────────────────────────────────────────
app.use('/', require('./routes/hotelRoutes')(hotelController));
app.use('/', require('./routes/authRoutes')(authController));
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
