-- Create Database
CREATE DATABASE IF NOT EXISTS smartshield;
USE smartshield;

-- Table: requests
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(50) NOT NULL,
  request_time TIMESTAMP NOT NULL
);

-- Table: suspicious_ips
CREATE TABLE IF NOT EXISTS suspicious_ips (
  ip_address VARCHAR(50) PRIMARY KEY,
  request_count INT NOT NULL,
  last_request TIMESTAMP NOT NULL
);

-- Table: blocked_ips
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip_address VARCHAR(50) PRIMARY KEY,
  blocked_at TIMESTAMP NOT NULL
);
