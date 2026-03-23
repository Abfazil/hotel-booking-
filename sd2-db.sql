-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Mar 09, 2026 at 10:33 AM
-- Server version: 9.6.0
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sd2-db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `check_in` date DEFAULT NULL,
  `check_out` date DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `booking_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `user_id`, `room_id`, `check_in`, `check_out`, `total_price`, `booking_status`, `created_at`) VALUES
(1, 1, 1, '2026-04-01', '2026-04-03', 180.00, 'Confirmed', '2026-03-09 09:31:44'),
(2, 2, 2, '2026-04-02', '2026-04-05', 420.00, 'Confirmed', '2026-03-09 09:31:44'),
(3, 3, 3, '2026-04-03', '2026-04-06', 900.00, 'Confirmed', '2026-03-09 09:31:44'),
(4, 4, 4, '2026-04-10', '2026-04-12', 240.00, 'Completed', '2026-03-09 09:31:44'),
(5, 5, 5, '2026-04-11', '2026-04-13', 320.00, 'Confirmed', '2026-03-09 09:31:44'),
(6, 6, 6, '2026-04-12', '2026-04-15', 1050.00, 'Confirmed', '2026-03-09 09:31:44'),
(7, 7, 7, '2026-04-15', '2026-04-18', 1800.00, 'Confirmed', '2026-03-09 09:31:44'),
(8, 8, 8, '2026-04-18', '2026-04-20', 360.00, 'Completed', '2026-03-09 09:31:44'),
(9, 9, 9, '2026-04-20', '2026-04-22', 200.00, 'Confirmed', '2026-03-09 09:31:44'),
(10, 10, 10, '2026-04-22', '2026-04-25', 960.00, 'Confirmed', '2026-03-09 09:31:44');

-- --------------------------------------------------------

--
-- Table structure for table `booking_history`
--

CREATE TABLE `booking_history` (
  `history_id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking_history`
--

INSERT INTO `booking_history` (`history_id`, `booking_id`, `status`, `changed_at`) VALUES
(1, 1, 'Created', '2026-03-09 09:32:29'),
(2, 2, 'Created', '2026-03-09 09:32:29'),
(3, 3, 'Created', '2026-03-09 09:32:29'),
(4, 4, 'Completed', '2026-03-09 09:32:29'),
(5, 5, 'Confirmed', '2026-03-09 09:32:29'),
(6, 6, 'Confirmed', '2026-03-09 09:32:29'),
(7, 7, 'Confirmed', '2026-03-09 09:32:29'),
(8, 8, 'Completed', '2026-03-09 09:32:29'),
(9, 9, 'Confirmed', '2026-03-09 09:32:29'),
(10, 10, 'Confirmed', '2026-03-09 09:32:29');

-- --------------------------------------------------------

--
-- Table structure for table `disputes`
--

CREATE TABLE `disputes` (
  `dispute_id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `issue` text,
  `dispute_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `disputes`
--

INSERT INTO `disputes` (`dispute_id`, `booking_id`, `user_id`, `issue`, `dispute_status`, `created_at`) VALUES
(1, 1, 1, 'Room not clean', 'Open', '2026-03-09 09:32:55'),
(2, 2, 2, 'Wrong billing', 'Resolved', '2026-03-09 09:32:55'),
(3, 3, 3, 'Late check-in', 'Open', '2026-03-09 09:32:55'),
(4, 4, 4, 'AC not working', 'Closed', '2026-03-09 09:32:55'),
(5, 5, 5, 'Noise complaint', 'Open', '2026-03-09 09:32:55'),
(6, 6, 6, 'Booking mismatch', 'Resolved', '2026-03-09 09:32:55'),
(7, 7, 7, 'Payment issue', 'Open', '2026-03-09 09:32:55'),
(8, 8, 8, 'Staff behavior', 'Closed', '2026-03-09 09:32:55'),
(9, 9, 9, 'Refund delay', 'Open', '2026-03-09 09:32:55'),
(10, 10, 10, 'Room type incorrect', 'Resolved', '2026-03-09 09:32:55');

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `hotel_id` int NOT NULL,
  `hotel_name` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`hotel_id`, `hotel_name`, `city`, `country`, `address`, `rating`) VALUES
(1, 'Grand Palace Hotel', 'London', 'UK', '221 Baker Street', 4.5),
(2, 'Sea View Resort', 'Barcelona', 'Spain', 'Beach Road 12', 4.2),
(3, 'Mountain Lodge', 'Zurich', 'Switzerland', 'Hill Street 7', 4.7),
(4, 'Royal Gardens Hotel', 'Paris', 'France', 'Rue Garden 21', 4.4),
(5, 'City Central Hotel', 'New York', 'USA', '5th Avenue', 4.3),
(6, 'Sunset Paradise', 'Maldives', 'Maldives', 'Island Road', 4.8),
(7, 'Golden Sands Hotel', 'Dubai', 'UAE', 'Palm Street', 4.6),
(8, 'Urban Stay Hotel', 'Berlin', 'Germany', 'Alexanderplatz 9', 4.1),
(9, 'Lakeview Resort', 'Toronto', 'Canada', 'Lake Shore Blvd', 4.3),
(10, 'Skyline Hotel', 'Tokyo', 'Japan', 'Shibuya Street 3', 4.5);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `booking_id`, `payment_date`, `amount`, `payment_method`, `payment_status`) VALUES
(1, 1, '2026-03-01', 180.00, 'Credit Card', 'Paid'),
(2, 2, '2026-03-02', 420.00, 'Debit Card', 'Paid'),
(3, 3, '2026-03-03', 900.00, 'PayPal', 'Paid'),
(4, 4, '2026-03-04', 240.00, 'Credit Card', 'Paid'),
(5, 5, '2026-03-05', 320.00, 'Debit Card', 'Paid'),
(6, 6, '2026-03-06', 1050.00, 'PayPal', 'Paid'),
(7, 7, '2026-03-07', 1800.00, 'Credit Card', 'Paid'),
(8, 8, '2026-03-08', 360.00, 'Debit Card', 'Paid'),
(9, 9, '2026-03-09', 200.00, 'PayPal', 'Pending'),
(10, 10, '2026-03-10', 960.00, 'Credit Card', 'Paid');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `hotel_id` int DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  `review_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `user_id`, `hotel_id`, `rating`, `comment`, `review_date`) VALUES
(1, 1, 1, 5, 'Amazing stay', '2026-04-04'),
(2, 2, 2, 4, 'Great service', '2026-04-06'),
(3, 3, 3, 5, 'Beautiful location', '2026-04-07'),
(4, 4, 4, 4, 'Nice hotel', '2026-04-12'),
(5, 5, 5, 3, 'Average experience', '2026-04-13'),
(6, 6, 6, 5, 'Luxury stay', '2026-04-16'),
(7, 7, 7, 5, 'Fantastic resort', '2026-04-19'),
(8, 8, 8, 4, 'Clean rooms', '2026-04-21'),
(9, 9, 9, 4, 'Friendly staff', '2026-04-23'),
(10, 10, 10, 5, 'Perfect stay', '2026-04-26');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int NOT NULL,
  `hotel_id` int DEFAULT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `price_per_night` decimal(10,2) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `available` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `hotel_id`, `room_type`, `price_per_night`, `capacity`, `available`) VALUES
(1, 1, 'Single', 90.00, 1, 1),
(2, 1, 'Double', 140.00, 2, 1),
(3, 2, 'Suite', 300.00, 4, 1),
(4, 3, 'Single', 120.00, 1, 1),
(5, 4, 'Double', 160.00, 2, 1),
(6, 5, 'Suite', 350.00, 4, 1),
(7, 6, 'Villa', 600.00, 6, 1),
(8, 7, 'Double', 180.00, 2, 1),
(9, 8, 'Single', 100.00, 1, 1),
(10, 9, 'Suite', 320.00, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `created_at`) VALUES
(1, 'John', 'Smith', 'john1@email.com', '0711111111', 'pass1', '2026-03-09 09:30:55'),
(2, 'Emma', 'Brown', 'emma2@email.com', '0711111112', 'pass2', '2026-03-09 09:30:55'),
(3, 'Liam', 'Wilson', 'liam3@email.com', '0711111113', 'pass3', '2026-03-09 09:30:55'),
(4, 'Olivia', 'Taylor', 'olivia4@email.com', '0711111114', 'pass4', '2026-03-09 09:30:55'),
(5, 'Noah', 'Anderson', 'noah5@email.com', '0711111115', 'pass5', '2026-03-09 09:30:55'),
(6, 'Ava', 'Thomas', 'ava6@email.com', '0711111116', 'pass6', '2026-03-09 09:30:55'),
(7, 'Sophia', 'Jackson', 'sophia7@email.com', '0711111117', 'pass7', '2026-03-09 09:30:55'),
(8, 'James', 'White', 'james8@email.com', '0711111118', 'pass8', '2026-03-09 09:30:55'),
(9, 'Mia', 'Harris', 'mia9@email.com', '0711111119', 'pass9', '2026-03-09 09:30:55'),
(10, 'Lucas', 'Martin', 'lucas10@email.com', '0711111120', 'pass10', '2026-03-09 09:30:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `booking_history`
--
ALTER TABLE `booking_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `disputes`
--
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`dispute_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`hotel_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `hotel_id` (`hotel_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD KEY `hotel_id` (`hotel_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `booking_history`
--
ALTER TABLE `booking_history`
  MODIFY `history_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `disputes`
--
ALTER TABLE `disputes`
  MODIFY `dispute_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `hotels`
--
ALTER TABLE `hotels`
  MODIFY `hotel_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

--
-- Constraints for table `booking_history`
--
ALTER TABLE `booking_history`
  ADD CONSTRAINT `booking_history_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Constraints for table `disputes`
--
ALTER TABLE `disputes`
  ADD CONSTRAINT `disputes_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  ADD CONSTRAINT `disputes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`);

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
