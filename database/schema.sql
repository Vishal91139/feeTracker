CREATE DATABASE IF NOT EXISTS student_fee_db;
USE student_fee_db;


CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','STAFF') DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15),
  email VARCHAR(100),
  parent_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_name VARCHAR(20) UNIQUE NOT NULL
);


CREATE TABLE student_academics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  class VARCHAR(20) NOT NULL,

  total_fee DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,

  due_amount DECIMAL(10,2)
    GENERATED ALWAYS AS (total_fee - paid_amount) STORED,

  UNIQUE (student_id, academic_year_id),

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);


CREATE TABLE receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_academic_id INT NOT NULL,

  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  payment_mode ENUM('CASH','UPI','CARD','BANK') NOT NULL,
  payment_date DATE NOT NULL,

  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_academic_id)
    REFERENCES student_academics(id)
    ON DELETE CASCADE
);
