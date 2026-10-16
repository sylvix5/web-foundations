CREATE TABLE users (
  id          INTEGER PRIMARY KEY,           -- unique id for each user
  name        TEXT NOT NULL,                 -- NOT NULL: must have a value
  email       TEXT NOT NULL UNIQUE,          -- UNIQUE: no two users share it
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP -- filled in automatically
);
 
CREATE TABLE notes (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  text        TEXT NOT NULL CHECK (length(text) <= 200),
  category    TEXT NOT NULL DEFAULT 'personal',
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    corse_code TEXT NOT NULL UNIQUE,
);

CREATE TABLE enrollments (
    enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    -- Rule preventing the same student from enrolling in the same course twice
    CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

INSERT INTO students (first_name, last_name, email) VALUES 
('Sylvia', 'Johnson', 'sylvia.johnson@example.com'),
('Bob', 'Smith', 'bob.smith@example.com'),
('Charlie', 'Brown', 'charlie.brown@example.com'),
('Diana', 'Aoko', 'diana.aoko@example.com'); -- Added an un-enrolled student for testing LEFT JOIN

-- Inserting at least 3 courses
INSERT INTO courses (course_name, course_code, credits) VALUES 
('Database Fundamentals', 'CS101', 3),
('Web Development Basics', 'CS102', 4),
('Introduction to Algorithms', 'CS103', 3);

-- Inserting at least 5 enrolments (linking students to courses with grades)
INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'A'),
(1, 2, 'B+'),
(2, 1, 'B'),
(3, 3, 'A-'),
(2, 3, 'C');


-- Query 1: All courses for one student (by name, e.g., Sylvia Johnson)
SELECT c.course_name, c.course_code, e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE s.first_name = 'Alice' AND s.last_name = 'Johnson';

-- Query 2: All students on one course (e.g., Database Fundamentals / CS101)
SELECT s.first_name, s.last_name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE c.course_code = 'CS101';

-- Query 3: The number of students per course
SELECT c.course_name, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name;

-- Query 4: Students who have no enrolments
SELECT s.student_id, s.first_name, s.last_name, s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 1;