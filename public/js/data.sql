CREATE DATABASE IF NOT EXISTS hotelease;

USE hotelease;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  city VARCHAR(50),
  price DECIMAL(10,2),
  image VARCHAR(255),
  description TEXT,
  rating DECIMAL(2,1)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  hotel_id INT,
  checkin_date DATE,
  checkout_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

INSERT INTO hotels (name, city, price, image, description, rating) VALUES
('The Ritz London', 'London', 250.00, 'ritz.jpg', 'One of London\'s most iconic luxury hotels located in Piccadilly.', 5.0),
('Premier Inn London', 'London', 89.00, 'premier.jpg', 'Comfortable and affordable hotel in the heart of London.', 3.5),
('The Savoy London', 'London', 320.00, 'savoy.jpg', 'A legendary luxury hotel on the Strand with stunning Thames views.', 5.0),
('Holiday Inn London', 'London', 110.00, 'holiday.jpg', 'Modern hotel with great transport links across London.', 4.0),
('Hotel Le Marais Paris', 'Paris', 180.00, 'marais.jpg', 'Charming boutique hotel in the historic Le Marais district.', 4.5),
('Ibis Paris Centre', 'Paris', 75.00, 'ibis.jpg', 'Budget friendly hotel perfectly located in central Paris.', 3.5),
('Le Bristol Paris', 'Paris', 450.00, 'bristol.jpg', 'One of Paris\'s finest palace hotels near the Champs Elysees.', 5.0),
('Novotel Paris', 'Paris', 140.00, 'novotel.jpg', 'Contemporary hotel with easy access to major Paris attractions.', 4.0);