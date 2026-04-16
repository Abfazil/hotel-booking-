# HotelEase

HotelEase is a Node.js + Express + Pug hotel booking UI with:
- MVC-style backend structure (`models`, `controllers`, `routes`)
- MySQL database
- phpMyAdmin for DB inspection
- Docker Compose setup for app + DB + phpMyAdmin
- Version 1.0.1
 
## Tech Stack

- Node.js
- Express
- Pug
- MySQL (`mysql2`)
- Docker + Docker Compose
- phpMyAdmin

## Project Structure

```├── CODE_OF_CONDUCT.md
├── controllers
│   ├── authController.js
│   ├── controllers
│   │   └── DisputeController.js
│   ├── dashboardController.js
│   ├── favouriteController.js
│   └── hotelController.js
├── db.js
├── docker-compose.yml
├── Dockerfile
├── LICENSE
├── middleware
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── models
│   ├── favouriteModel.js
│   ├── hotelModel.js
│   ├── reviewModel.js
│   └── userModel.js
├── mysql-init
│   ├── 002_sd2-db_dump.sql
│   ├── 003_auth_tables.sql
│   └── 004_seed_admin.sql
├── package.json
├── public
│   ├── css
│   │   └── style.css
│   ├── images
│   │   ├── gallery_01.jpg
│   │   ├── gallery_02.jpg
│   │   ├── homepage_image.webp
│   │   └── why_choose_us.jpg
│   └── js
│       └── main.js
├── README.md
├── routes
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── disputeRoutes.js
│   ├── favouriteRoutes.js
│   └── hotelRoutes.js
├── server.js
└── views
    ├── auth
    │   ├── login.pug
    │   └── register.pug
    ├── booking_dispute.pug
    ├── dashboards
    │   ├── admin-dashboard.pug
    │   └── customer-dashboard.pug
    ├── favourites.pug
    ├── hotel-detail.pug
    ├── hotels-list.pug
    ├── index.pug
    ├── layout.pug
    ├── login.pug
    ├── partials
    │   ├── footer.pug
    │   ├── mixins.pug
    │   ├── nav.pug
    │   └── reviews.pug
    ├── register.pug
    ├── reviews.pug
    └── thank-you.pug
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


## Available Routes

- **Hotels**
  - `GET /` - Home page
  - `GET /hotels` - Hotels listing
  - `GET /hotels/:id` - Hotel details

- **Auth**
  - `GET /register` - Registration page
  - `POST /register` - Create account
  - `GET /login` - Login page
  - `POST /login` - Login
  - `GET /logout` - Logout

- **Dashboards (requires auth + role)**
  - `GET /dashboard` - Customer dashboard (role: `customer`)
  - `GET /admin` - Admin dashboard (role: `admin`)

- **Favourites (requires auth)**
  - `GET /favourites` - List favourites
  - `POST /favourites/:hotelId/toggle` - Toggle favourite 

- **Booking disputes**
  - `GET /disputes` - Dispute form/list
  - `POST /disputes` - Create dispute

## Database Notes

- Primary DB for this project: `sd2-db`
- Main UI query currently reads from:
  - `hotels` (`hotel_id`, `hotel_name`, `city`, `country`, `rating`)
  - `rooms` (`price_per_night`) for pricing
- If DB returns no rows or is unavailable, model fallback is used.

## Troubleshooting

### App starts but no DB data in phpMyAdmin


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
