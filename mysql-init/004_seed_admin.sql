-- Seed one admin account for HotelEase.
-- Email: admin@hotelease.com
-- Password: Admin@123

-- Add role column for legacy schema.
-- This init script is executed on a fresh DB volume in Docker.
ALTER TABLE users
  ADD COLUMN role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer';

-- Ensure old users have a role value.
UPDATE users
SET role = 'customer'
WHERE role IS NULL OR role = '';

-- Insert admin user for legacy schema.
INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
SELECT 'Admin', 'User', 'admin@hotelease.com', NULL, '$2b$12$v9O7qRiB9hbqPEX3iwSZmeCOUBEd9kR8W.6HZoU8KmuyAM/dIiGS6', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@hotelease.com'
);
