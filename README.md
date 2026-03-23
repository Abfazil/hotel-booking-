# HotelEase

HotelEase is a Node.js + Express + Pug hotel booking UI with:
- MVC-style backend structure (`models`, `controllers`, `routes`)
- MySQL database
- phpMyAdmin for DB inspection
- Docker Compose setup for app + DB + phpMyAdmin

## Tech Stack

- Node.js
- Express
- Pug
- MySQL (`mysql2`)
- Docker + Docker Compose
- phpMyAdmin

## Project Structure

```text
hotelease/
├── server.js
├── db.js
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env
├── controllers/
│   ├── hotelController.js
│   └── authController.js
├── models/
│   └── hotelModel.js
├── routes/
│   ├── hotelRoutes.js
│   └── authRoutes.js
├── mysql-init/
│   └── 002_sd2-db_dump.sql
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
└── views/
    ├── layout.pug
    ├── index.pug
    ├── hotels-list.pug
    ├── hotel-detail.pug
    ├── login.pug
    ├── register.pug
    └── partials/
```

## Environment Variables

Defined in `.env`:

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=sd2-db
PORT=3000
```

## Run with Docker (Recommended)

### 1) Build and start all services

```bash
docker compose up --build
```

### 2) Access services

- App: `http://localhost:3000`
- phpMyAdmin: `http://localhost:8080`
  - Username: `root`
  - Password: `rootpassword`

### 3) Database initialization

The SQL dump at `mysql-init/002_sd2-db_dump.sql` is auto-imported by MySQL on **first container initialization**.

If you already had old MySQL data volume, reinitialize once:

```bash
docker compose down -v
docker compose up --build
```

## Run Locally (Without Docker)

### 1) Install dependencies

```bash
npm install
```

### 2) Start server

```bash
npm start
```

Or development mode:

```bash
npm run dev
```

> Note: If local MySQL is not reachable, the app uses fallback in-memory hotel data so UI pages still render.

## Available Routes

- `GET /` - Home page
- `GET /hotels` - Hotels listing
- `GET /hotels/:id` - Hotel details
- `GET /login` - Login page
- `GET /register` - Registration page

## Database Notes

- Primary DB for this project: `sd2-db`
- Main UI query currently reads from:
  - `hotels` (`hotel_id`, `hotel_name`, `city`, `country`, `rating`)
  - `rooms` (`price_per_night`) for pricing
- If DB returns no rows or is unavailable, model fallback is used.

## Troubleshooting

### App starts but no DB data in phpMyAdmin

Likely old Docker volume. Recreate containers with:

```bash
docker compose down -v
docker compose up --build
```

### `getaddrinfo EAI_AGAIN mysql` when running locally

`DB_HOST=mysql` only resolves inside Docker network. For local host execution, change `.env`:

```env
DB_HOST=localhost
```

### Port conflict on 3000

Set a different port in `.env`:

```env
PORT=3001
```

## Scripts

- `npm start` - start server with Node
- `npm run dev` - start server with Nodemon
