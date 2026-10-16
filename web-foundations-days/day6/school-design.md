# School Database Design

## Table Explanations & Relationships

### Tables Overview

- **`students`**: Stores individual student records including their unique identifier, first name, last name, and a unique email address to prevent duplicate accounts.
- **`courses`**: Holds details about available academic courses, including a unique course code, course name, and credit value.
- **`enrolments`**: Acts as a junction/join table connecting students to courses. It tracks which student takes which course and records their performance via a `grade` column.

### Relationships & Why a Join Table is Needed

- **`students` and `courses` (Many-to-Many Relationship)**: A single student can enroll in multiple courses, and a single course can have many students enrolled in it. Because relational databases cannot directly represent a many-to-many relationship in a single table, a **join table (`enrolments`)** is required.
- **One-to-Many Breakdown**: The `enrolments` table forms two one-to-many relationships:
  1. One `student` can have many `enrolments`.
  2. One `course` can have many `enrolments`.
     This bridge table also stores relationship-specific attributes, such as the `grade` earned by a specific student in a specific course.

---

## Indexing Strategy

- **Index to Add**: An index on the foreign key column `student_id` in the `enrolments` table (`CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`).
- **Reason**: In a school database, applications frequently query a student's history or look up all courses linked to a particular student ID. Indexing this foreign key drastically speeds up lookup and `JOIN` performance by allowing the database engine to locate related records directly without performing a full table scan.

---

## SQL vs. NoSQL Justification

For a school management system, **SQL (Relational Database)** is the superior choice over NoSQL. School administrative systems rely heavily on strict data integrity, explicit schemas, and complex relationships (students, teachers, classes, enrolments, grades, and attendance). SQL databases enforce ACID (Atomicity, Consistency, Isolation, Durability) properties, which are critical when managing sensitive records like grades and tuition payments to prevent partial updates or data corruption.
