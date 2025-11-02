-- LearnMate South Sudan - Sample Data Seed
-- This file contains sample data for testing and development

USE learnmate_db;

-- Insert sample users (passwords are hashed version of "Password123")
INSERT INTO users (username, email, password_hash, role, first_name, last_name, grade_level, preferred_language) VALUES
('admin_user', 'admin@gmail.com', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'admin', 'Admin', 'User', NULL, 'en'),
('teacher_john', 'john.doe@learnmate.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'teacher', 'John', 'Doe', NULL, 'en'),
('teacher_mary', 'mary.smith@learnmate.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'teacher', 'Mary', 'Smith', NULL, 'en'),
('student_alice', 'alice@student.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'student', 'Alice', 'Johnson', 8, 'en'),
('student_bob', 'bob@student.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'student', 'Bob', 'Williams', 8, 'en'),
('student_carol', 'carol@student.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'student', 'Carol', 'Brown', 9, 'en'),
('student_david', 'david@student.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'student', 'David', 'Jones', 9, 'en'),
('student_eve', 'eve@student.ss', '$2a$10$iquTqoDllH/XPJrXavHUn.agKCEP2aHY.RgNuP/FUylymEF/vwV6q', 'student', 'Eve', 'Davis', 10, 'en');

-- Insert sample subjects
INSERT INTO subjects (name, description, grade_level, created_by) VALUES
('Mathematics - Grade 8', 'Comprehensive mathematics course covering algebra, geometry, and statistics', 8, 2),
('Science - Grade 8', 'Introduction to physics, chemistry, and biology', 8, 2),
('English - Grade 9', 'English language and literature for grade 9 students', 9, 3),
('History - Grade 9', 'World history and South Sudan history', 9, 3),
('Mathematics - Grade 10', 'Advanced mathematics including trigonometry and calculus basics', 10, 2);

-- Insert sample lessons
INSERT INTO lessons (subject_id, title, content, order_number, language, created_by, is_published) VALUES
-- Math Grade 8
(1, 'Introduction to Algebra', 'Algebra is a branch of mathematics dealing with symbols and rules for manipulating those symbols. In this lesson, we will learn about variables, expressions, and basic equations.', 1, 'en', 2, true),
(1, 'Solving Linear Equations', 'Linear equations are equations of the first degree. Learn how to solve equations like 2x + 5 = 15.', 2, 'en', 2, true),
(1, 'Introduction to Geometry', 'Geometry is the study of shapes, sizes, and positions. We will explore basic geometric shapes and their properties.', 3, 'en', 2, true),

-- Science Grade 8
(2, 'The Scientific Method', 'The scientific method is a systematic way of learning about the world. Learn the steps: observation, hypothesis, experiment, and conclusion.', 1, 'en', 2, true),
(2, 'States of Matter', 'Matter exists in three main states: solid, liquid, and gas. Learn about the properties of each state.', 2, 'en', 2, true),
(2, 'Introduction to Cells', 'Cells are the basic building blocks of life. Learn about cell structure and function.', 3, 'en', 2, true),

-- English Grade 9
(3, 'Parts of Speech', 'Learn about nouns, verbs, adjectives, adverbs, and other parts of speech.', 1, 'en', 3, true),
(3, 'Writing Paragraphs', 'A well-structured paragraph has a topic sentence, supporting details, and a conclusion.', 2, 'en', 3, true),

-- History Grade 9
(4, 'Ancient Civilizations', 'Explore the great civilizations of ancient Egypt, Greece, and Rome.', 1, 'en', 3, true),
(4, 'Independence of South Sudan', 'Learn about the journey to South Sudan independence in 2011.', 2, 'en', 3, true);

-- Insert sample quizzes
INSERT INTO quizzes (lesson_id, title, description, time_limit, passing_score, max_attempts, created_by) VALUES
(1, 'Algebra Basics Quiz', 'Test your understanding of basic algebra concepts', 15, 70, 3, 2),
(2, 'Linear Equations Test', 'Solve linear equations to test your skills', 20, 70, 3, 2),
(4, 'Scientific Method Quiz', 'Assessment on the scientific method', 10, 60, 3, 2),
(7, 'Parts of Speech Test', 'Identify parts of speech in sentences', 15, 70, 3, 3);

-- Insert sample questions
-- Quiz 1: Algebra Basics
INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, points, order_number) VALUES
(1, 'What is a variable in algebra?', 'multiple_choice', NULL, 5, 1),
(1, 'Solve: x + 5 = 12. What is x?', 'short_answer', '7', 5, 2),
(1, 'Is algebra used in real life?', 'true_false', 'True', 5, 3);

-- Quiz 2: Linear Equations
INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, points, order_number) VALUES
(2, 'Solve: 2x = 10. What is x?', 'short_answer', '5', 10, 1),
(2, 'What is the first step in solving 3x + 6 = 15?', 'multiple_choice', NULL, 10, 2);

-- Quiz 3: Scientific Method
INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, points, order_number) VALUES
(3, 'What is the first step of the scientific method?', 'multiple_choice', NULL, 10, 1),
(3, 'A hypothesis must be testable.', 'true_false', 'True', 5, 2);

-- Insert question options for multiple choice questions
INSERT INTO question_options (question_id, option_text, is_correct) VALUES
-- Q1 options
(1, 'A letter that represents a number', true),
(1, 'A constant value', false),
(1, 'A mathematical operation', false),
(1, 'A type of equation', false),

-- Q5 options
(5, 'Subtract 6 from both sides', true),
(5, 'Divide both sides by 3', false),
(5, 'Add 6 to both sides', false),
(5, 'Multiply both sides by 3', false),

-- Q6 options
(6, 'Observation', true),
(6, 'Hypothesis', false),
(6, 'Experiment', false),
(6, 'Conclusion', false);

-- Insert sample enrollments
INSERT INTO enrollments (student_id, subject_id) VALUES
(4, 1), -- Alice in Math Grade 8
(4, 2), -- Alice in Science Grade 8
(5, 1), -- Bob in Math Grade 8
(5, 2), -- Bob in Science Grade 8
(6, 3), -- Carol in English Grade 9
(6, 4), -- Carol in History Grade 9
(7, 3), -- David in English Grade 9
(7, 4), -- David in History Grade 9
(8, 5); -- Eve in Math Grade 10

-- Insert sample student progress
INSERT INTO student_progress (student_id, lesson_id, is_completed, time_spent) VALUES
(4, 1, true, 1200),  -- Alice completed Intro to Algebra
(4, 2, true, 1500),  -- Alice completed Linear Equations
(4, 3, false, 600),  -- Alice started Geometry
(5, 1, true, 1000),  -- Bob completed Intro to Algebra
(5, 4, true, 900),   -- Bob completed Scientific Method
(6, 7, true, 800),   -- Carol completed Parts of Speech
(7, 7, false, 400);  -- David started Parts of Speech

-- Insert sample quiz attempts
INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points, attempt_number, completed_at) VALUES
(1, 4, 14, 15, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),  -- Alice scored 14/15 on Algebra Quiz
(1, 5, 12, 15, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),  -- Bob scored 12/15 on Algebra Quiz
(3, 5, 13, 15, 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)), -- Bob scored 13/15 on Scientific Method
(4, 6, 10, 15, 1, DATE_SUB(NOW(), INTERVAL 1 DAY));  -- Carol scored 10/15 on Parts of Speech

-- Insert sample student answers (for completed attempts)
-- Note: In real usage, these would be created through the quiz submission endpoint

COMMIT;

-- Display summary
SELECT 'Database seeded successfully!' as Status;
SELECT COUNT(*) as 'Total Users' FROM users;
SELECT COUNT(*) as 'Total Subjects' FROM subjects;
SELECT COUNT(*) as 'Total Lessons' FROM lessons;
SELECT COUNT(*) as 'Total Quizzes' FROM quizzes;
SELECT COUNT(*) as 'Total Enrollments' FROM enrollments;
