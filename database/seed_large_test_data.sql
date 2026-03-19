USE student_fee_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE receipts;
TRUNCATE TABLE student_academics;
TRUNCATE TABLE students;
TRUNCATE TABLE academic_years;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users
INSERT INTO users (full_name, email, password, role) VALUES
('Admin User', 'admin@school.test', 'pass', 'ADMIN'),
('Staff 1', 'staff1@school.test', 'pass', 'STAFF'),
('Staff 2', 'staff2@school.test', 'pass', 'STAFF');

-- Academic years
INSERT INTO academic_years (id, year_name, is_current, is_active) VALUES
(1, '2021-2022', 0, 0),
(2, '2022-2023', 0, 0),
(3, '2023-2024', 0, 0),
(4, '2024-2025', 0, 0),
(5, '2025-2026', 1, 1);

-- 🔥 Generate 180 students (WORKING)
INSERT INTO students (full_name, mobile, email, parent_name)
SELECT
  CONCAT('Student ', LPAD(n, 3, '0')),
  CONCAT('9', LPAD(n, 9, '0')),
  CONCAT('student', n, '@school.test'),
  CONCAT('Parent ', LPAD(n, 3, '0'))
FROM (
  SELECT @row := @row + 1 AS n
  FROM information_schema.tables, (SELECT @row := 0) r
  LIMIT 180
) numbers;

-- Current year academics
INSERT INTO student_academics (student_id, academic_year_id, class, total_fee, paid_amount)
SELECT
  s.id,
  5,
  CASE ((s.id - 1) % 6) + 1
    WHEN 1 THEN '7th'
    WHEN 2 THEN '8th'
    WHEN 3 THEN '9th'
    WHEN 4 THEN '10th'
    WHEN 5 THEN '11th'
    ELSE '12th'
  END,
  CASE ((s.id - 1) % 6) + 1
    WHEN 1 THEN 28000
    WHEN 2 THEN 30000
    WHEN 3 THEN 33000
    WHEN 4 THEN 36000
    WHEN 5 THEN 39000
    ELSE 42000
  END,
  CASE
    WHEN s.id % 7 = 0 THEN 0
    WHEN s.id % 5 = 0 THEN 10000
    WHEN s.id % 3 = 0 THEN 20000
    ELSE 30000
  END
FROM students s;

-- Receipts (simple version)
INSERT INTO receipts (student_academic_id, receipt_number, amount, payment_mode, payment_date, remarks)
SELECT
  sa.id,
  CONCAT('RCPT-', sa.id),
  sa.paid_amount,
  'UPI',
  CURDATE(),
  'Full Payment'
FROM student_academics sa
WHERE sa.paid_amount > 0;

-- ✅ Check
SELECT COUNT(*) AS students FROM students;
SELECT COUNT(*) AS academics FROM student_academics;
SELECT COUNT(*) AS receipts FROM receipts;