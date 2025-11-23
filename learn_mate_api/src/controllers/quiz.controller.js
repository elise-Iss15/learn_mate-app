const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get quiz by ID with questions
 * GET /api/quizzes/:id
 */
const getQuizById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : null;

  const [quizzes] = await pool.query(
    `SELECT q.*, 
            l.title as lesson_title,
            s.name as subject_name
     FROM quizzes q
     JOIN lessons l ON q.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE q.id = ?`,
    [id]
  );

  if (quizzes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  const quiz = quizzes[0];

  const [questions] = await pool.query(
    `SELECT id, question_text, question_type, points, order_number
     FROM questions
     WHERE quiz_id = ?
     ORDER BY order_number ASC, id ASC`,
    [id]
  );

  for (let question of questions) {
    if (question.question_type === 'multiple_choice') {
      const [options] = await pool.query(
        `SELECT id, option_text, is_correct
         FROM question_options
         WHERE question_id = ?
         ORDER BY id ASC`,
        [question.id]
      );
      question.options = options;
    }
  }

  quiz.questions = questions;

  if (userId && req.user.role === 'student') {
    const [attempts] = await pool.query(
      `SELECT id, score, total_points, attempt_number, started_at, completed_at
       FROM quiz_attempts
       WHERE quiz_id = ? AND student_id = ?
       ORDER BY attempt_number DESC`,
      [id, userId]
    );

    quiz.user_attempts = attempts;
    quiz.attempts_remaining = quiz.max_attempts - attempts.length;
  }

  res.json({
    success: true,
    data: { quiz }
  });
});

/**
 * Create new quiz
 * POST /api/quizzes
 * @access Teacher, Admin
 */
const createQuiz = asyncHandler(async (req, res) => {
  const {
    lesson_id,
    title,
    description,
    time_limit = 30,
    passing_score = 60,
    max_attempts = 3,
    questions = []
  } = req.body;
  const created_by = req.user.id;

  const [lessons] = await pool.query(
    `SELECT l.id, s.created_by as subject_creator
     FROM lessons l
     JOIN subjects s ON l.subject_id = s.id
     WHERE l.id = ?`,
    [lesson_id]
  );

  if (lessons.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found'
    });
  }

  if (req.user.role !== 'admin' && lessons[0].subject_creator !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only create quizzes for your own lessons'
    });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const quizQuery = `
      INSERT INTO quizzes (lesson_id, title, description, time_limit, passing_score, max_attempts, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [quizResult] = await connection.query(quizQuery, [
      lesson_id,
      title,
      description || null,
      time_limit,
      passing_score,
      max_attempts,
      created_by
    ]);

    const quizId = quizResult.insertId;

    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionQuery = `
          INSERT INTO questions (quiz_id, question_text, question_type, correct_answer, points, order_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [questionResult] = await connection.query(questionQuery, [
          quizId,
          q.question_text,
          q.question_type,
          q.correct_answer || null,
          q.points || 1,
          q.order_number || i + 1
        ]);

        const questionId = questionResult.insertId;

        if (q.question_type === 'multiple_choice' && q.options && q.options.length > 0) {
          for (let option of q.options) {
            const optionQuery = `
              INSERT INTO question_options (question_id, option_text, is_correct)
              VALUES (?, ?, ?)
            `;

            await connection.query(optionQuery, [
              questionId,
              option.option_text,
              option.is_correct || false
            ]);
          }
        }
      }
    }

    await connection.commit();

    const [quizzes] = await pool.query(
      'SELECT * FROM quizzes WHERE id = ?',
      [quizId]
    );

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz: quizzes[0] }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Update quiz
 * PUT /api/quizzes/:id
 * @access Teacher (owner), Admin
 */
const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, time_limit, passing_score, max_attempts } = req.body;

  const [quizzes] = await pool.query(
    `SELECT q.*, l.subject_id, s.created_by as subject_creator
     FROM quizzes q
     JOIN lessons l ON q.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE q.id = ?`,
    [id]
  );

  if (quizzes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  const quiz = quizzes[0];

  if (req.user.role !== 'admin' && quiz.subject_creator !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only update quizzes in your own subjects'
    });
  }

  const query = `
    UPDATE quizzes
    SET title = ?, description = ?, time_limit = ?, passing_score = ?, max_attempts = ?
    WHERE id = ?
  `;

  await pool.query(query, [
    title || quiz.title,
    description !== undefined ? description : quiz.description,
    time_limit || quiz.time_limit,
    passing_score || quiz.passing_score,
    max_attempts || quiz.max_attempts,
    id
  ]);

  const [updatedQuizzes] = await pool.query(
    'SELECT * FROM quizzes WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'Quiz updated successfully',
    data: { quiz: updatedQuizzes[0] }
  });
});

/**
 * Delete quiz
 * DELETE /api/quizzes/:id
 * @access Teacher (owner), Admin
 */
const deleteQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [quizzes] = await pool.query(
    `SELECT q.*, s.created_by as subject_creator
     FROM quizzes q
     JOIN lessons l ON q.lesson_id = l.id
     JOIN subjects s ON l.subject_id = s.id
     WHERE q.id = ?`,
    [id]
  );

  if (quizzes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  const quiz = quizzes[0];

  if (req.user.role !== 'admin' && quiz.subject_creator !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete quizzes in your own subjects'
    });
  }

  await pool.query('DELETE FROM quizzes WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Quiz deleted successfully'
  });
});

/**
 * Start quiz attempt
 * POST /api/quizzes/:id/start
 * @access Student
 */
const startQuizAttempt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student_id = req.user.id;

  const [quizzes] = await pool.query(
    'SELECT * FROM quizzes WHERE id = ?',
    [id]
  );

  if (quizzes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  const quiz = quizzes[0];

  const [attempts] = await pool.query(
    'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
    [id, student_id]
  );

  if (attempts[0].count >= quiz.max_attempts) {
    return res.status(400).json({
      success: false,
      message: 'Maximum attempts reached for this quiz'
    });
  }

  const [pointsResult] = await pool.query(
    'SELECT SUM(points) as total FROM questions WHERE quiz_id = ?',
    [id]
  );

  const total_points = pointsResult[0].total || 0;

  const query = `
    INSERT INTO quiz_attempts (quiz_id, student_id, total_points, attempt_number, is_synced)
    VALUES (?, ?, ?, ?, true)
  `;

  const [result] = await pool.query(query, [
    id,
    student_id,
    total_points,
    attempts[0].count + 1
  ]);

  res.status(201).json({
    success: true,
    message: 'Quiz attempt started',
    data: {
      attempt_id: result.insertId,
      attempt_number: attempts[0].count + 1,
      time_limit: quiz.time_limit
    }
  });
});

/**
 * Submit quiz answers
 * POST /api/quizzes/:id/submit
 * @access Student
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attempt_id, answers } = req.body;
  const student_id = req.user.id;

  const [attempts] = await pool.query(
    'SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ? AND quiz_id = ?',
    [attempt_id, student_id, id]
  );

  if (attempts.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Quiz attempt not found'
    });
  }

  const attempt = attempts[0];

  if (attempt.completed_at) {
    return res.status(400).json({
      success: false,
      message: 'This attempt has already been submitted'
    });
  }

  const [quizzes] = await pool.query(
    'SELECT * FROM quizzes WHERE id = ?',
    [id]
  );

  const quiz = quizzes[0];

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    let totalScore = 0;
    const feedback = [];

    for (let answer of answers) {
      const { question_id, student_answer } = answer;

      const [questions] = await connection.query(
        'SELECT * FROM questions WHERE id = ? AND quiz_id = ?',
        [question_id, id]
      );

      if (questions.length === 0) {
        continue;
      }

      const question = questions[0];
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.question_type === 'multiple_choice') {
        const [options] = await connection.query(
          'SELECT * FROM question_options WHERE question_id = ? AND option_text = ? AND is_correct = true',
          [question_id, student_answer]
        );

        isCorrect = options.length > 0;
      } else if (question.question_type === 'true_false') {
        isCorrect = student_answer.toLowerCase() === question.correct_answer.toLowerCase();
      } else if (question.question_type === 'short_answer') {
        isCorrect = student_answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      }

      if (isCorrect) {
        pointsEarned = question.points;
        totalScore += pointsEarned;
      }

      const answerQuery = `
        INSERT INTO student_answers (attempt_id, question_id, student_answer, is_correct, points_earned)
        VALUES (?, ?, ?, ?, ?)
      `;

      await connection.query(answerQuery, [
        attempt_id,
        question_id,
        student_answer,
        isCorrect,
        pointsEarned
      ]);

      feedback.push({
        question_id,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        correct_answer: !isCorrect ? question.correct_answer : undefined
      });
    }

    const updateQuery = `
      UPDATE quiz_attempts
      SET score = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(updateQuery, [totalScore, attempt_id]);

    await connection.commit();

    const percentage = (totalScore / attempt.total_points) * 100;
    const passed = percentage >= quiz.passing_score;

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        score: totalScore,
        total_points: attempt.total_points,
        percentage: Math.round(percentage),
        passed,
        attempt_number: attempt.attempt_number,
        feedback
      }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Get student's quiz attempts
 * GET /api/quizzes/:id/attempts
 * @access Student
 */
const getQuizAttempts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student_id = req.user.id;

  const [attempts] = await pool.query(
    `SELECT qa.*
     FROM quiz_attempts qa
     WHERE qa.quiz_id = ? AND qa.student_id = ?
     ORDER BY qa.attempt_number DESC`,
    [id, student_id]
  );

  for (let attempt of attempts) {
    if (attempt.completed_at) {
      const [answers] = await pool.query(
        `SELECT sa.*, q.question_text, q.question_type
         FROM student_answers sa
         JOIN questions q ON sa.question_id = q.id
         WHERE sa.attempt_id = ?
         ORDER BY q.order_number ASC`,
        [attempt.id]
      );

      attempt.answers = answers;
    }
  }

  res.json({
    success: true,
    data: { attempts }
  });
});

module.exports = {
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  startQuizAttempt,
  submitQuiz,
  getQuizAttempts
};
