# HotelEase — Pug Website Guide

## What is Pug?
Pug (formerly Jade) is a **template engine** for Node.js. Instead of writing raw HTML,
you write indentation-based syntax that compiles INTO HTML. Express.js renders it server-side.

---

## Project Structure

```
hotelease/
├── server.js               ← Node.js / Express entry point
├── package.json            ← Dependencies list
├── views/                  ← All Pug templates
│   ├── layout.pug          ← Base HTML shell (nav + footer shared here)
│   ├── index.pug           ← Home page (extends layout)
│   └── partials/
│       ├── nav.pug         ← Navigation component
│       ├── footer.pug      ← Footer component
│       └── mixins.pug      ← Reusable component functions (hotel card, etc.)
└── public/                 ← Static files served as-is
    ├── css/style.css       ← All styles
    └── js/main.js          ← Client-side interactivity
```

---

## How to Run (Step-by-Step)

### Step 1 — Install Node.js
Download from https://nodejs.org (choose LTS version)

Verify:
```bash
node --version    # e.g. v20.11.0
npm --version     # e.g. 10.2.4
```

### Step 2 — Install Dependencies
```bash
cd hotelease
npm install
```
This reads package.json and installs Express + Pug into node_modules/

### Step 3 — Start the Server
```bash
node server.js
```
You should see: ✅  HotelEase running → http://localhost:3000

### Step 4 — View in Browser
Open: http://localhost:3000

---

## How Pug Works (Key Concepts)

### 1. Indentation = Nesting (NO closing tags!)
```pug
nav
  ul
    li
      a(href="/") Home
```
Compiles to:
```html
<nav><ul><li><a href="/">Home</a></li></ul></nav>
```

### 2. Attributes in Parentheses
```pug
a(href="/" class="active") Home
img(src="/img/hotel.jpg" alt="Hotel")
```

### 3. extends + block (Layout Inheritance)
```pug
// layout.pug
html
  body
    block content   ← placeholder

// index.pug
extends layout
block content
  h1 Hello World   ← fills the placeholder
```

### 4. include (Partials)
```pug
include partials/nav     ← pastes nav.pug content here
include partials/footer
```

### 5. mixin (Reusable Components — like functions)
```pug
// Define once in mixins.pug
mixin hotelCard(hotel)
  article.hotel-card
    h3= hotel.name

// Call anywhere with +
+hotelCard(hotel)
```

### 6. each (Loops from server data)
```pug
each hotel in hotels
  +hotelCard(hotel)
```
`hotels` is passed from server.js: `res.render('index', { hotels: [...] })`

### 7. CSS Classes & IDs
```pug
section#home.hero          → <section id="home" class="hero">
div.card.card--active      → <div class="card card--active">
```

---

## Development Tips

### Auto-restart on file changes (install nodemon)
```bash
npm run dev
```

### Adding a New Page
1. Create `views/about.pug` extending layout
2. Add route in server.js: `app.get('/about', (req, res) => res.render('about'))`
3. Link to it: `a(href="/about") About`

---

## Tech Stack Summary
| Tool    | Role                              |
|---------|-----------------------------------|
| Node.js | JavaScript runtime                |
| Express | Web server / routing              |
| Pug     | HTML template engine              |
| CSS     | Styling (no framework needed)     |
| JS      | Browser-side interactions         |
