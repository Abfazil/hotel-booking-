/**
 * server.js — HotelEase Express Application
 * Serves Pug templates with a clean MVC-like structure.
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.render('index', {
    title:  'HotelEase — Find Your Perfect Stay',
    hotels: generateHotels(8),
  });
});

app.get('/hotels', (req, res) => {
  const hotels = generateHotels(12);
  res.render('hotels-list', {
    title:  'All Hotels — HotelEase',
    hotels,
  });
});

app.get('/hotels/:id', (req, res) => {
  const hotels = generateHotels(12);
  const id     = Number(req.params.id);
  const hotel  = hotels.find(h => h.id === id) || hotels[0];

  res.render('hotel-detail', {
    title: `Stay at ${hotel.name} — HotelEase`,
    hotel,
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Log In — HotelEase',
  });
});

app.get('/register', (req, res) => {
  res.render('register', {
    title: 'Create Account — HotelEase',
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateHotels(count) {
  const baseHotels = [
    { name: 'Seaside Escape Resort',     price: 129, rating: 4.7, location: 'Miami Beach, USA', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80' },
    { name: 'Midtown Skyline Hotel',     price: 159, rating: 4.5, location: 'New York, USA', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80' },
    { name: 'Old Town Boutique Suites',  price: 98,  rating: 4.3, location: 'Prague, Czech Republic', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80' },
    { name: 'Sunset Cliffs Retreat',     price: 185, rating: 4.8, location: 'Santorini, Greece', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80' },
    { name: 'Emerald Forest Lodge',      price: 142, rating: 4.6, location: 'Vancouver, Canada', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80' },
    { name: 'City Lights Business Inn',  price: 118, rating: 4.2, location: 'London, United Kingdom', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80' },
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const base = baseHotels[index % baseHotels.length];
    return {
      id:       index + 1,
      name:     base.name,
      price:    base.price,
      rating:   base.rating,
      location: base.location,
      image:    base.image,
    };
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`HotelEase running → http://localhost:${PORT}`);
});
