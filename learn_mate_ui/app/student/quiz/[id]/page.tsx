'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { syncQueue, offlineManager } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Quiz as APIQuiz, Question } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface QuizResult {
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    question_id: number;
    selected_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }>;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const quizId = parseInt(params.id as string);

  const [quiz, setQuiz] = useState<APIQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      if (isOnline) {
        const data = await api.getQuizById(quizId);
        setQuiz(data as APIQuiz);
      } else {
        // Try to find quiz in offline storage
        const offlineSubjects = await offlineManager.getAllOfflineSubjects();
        let foundQuiz: APIQuiz | null = null;

        for (const offlineSubject of offlineSubjects) {
          const quizMatch = offlineSubject.quizzes.find(q => q.id === quizId);
          if (quizMatch) {
            foundQuiz = quizMatch as APIQuiz;
            break;
          }
        }

        if (foundQuiz) {
          setQuiz(foundQuiz);
        } else {
          setError('This quiz is not available offline. Please go online to take it.');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch quiz:', err);
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = {
        quiz_id: quizId,
        answers: quiz.questions.map(q => ({
          question_id: q.id,
          selected_answer: answers[q.id]
        }))
      };

      if (isOnline) {
        // For online mode, create attempt first then submit
        const attempt = await api.startQuizAttempt(quizId);
        const resultData = await api.submitQuiz(attempt.id, {
          attempt_id: attempt.id,
          answers: submissionData.answers
        });
        setResult(resultData as QuizResult);
      } else {
        // Queue for sync and calculate result locally
        await syncQueue.add({
          type: 'quiz_submit',
          endpoint: `/student/quiz/${quizId}/submit`,
          method: 'POST',
          payload: submissionData
        });

        // Calculate result locally
        let correct = 0;
        const resultAnswers = quiz.questions.map(q => {
          const isCorrect = answers[q.id] === q.correct_answer;
          if (isCorrect) correct++;
          return {
            question_id: q.id,
            selected_answer: answers[q.id],
            correct_answer: q.correct_answer,
            is_correct: isCorrect
          };
        });

        const percentage = (correct / quiz.questions.length) * 100;
        setResult({
          score: correct,
          total_questions: quiz.questions.length,
          percentage,
          passed: percentage >= quiz.passing_score,
          answers: resultAnswers
        });
      }
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Quiz not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show results if quiz is submitted
  if (result) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="text-center">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                result.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.passed ? (
                  <Award className="h-10 w-10 text-green-600" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl mb-2">
                {result.passed ? 'Congratulations!' : 'Keep Practicing'}
              </CardTitle>
              <p className="text-muted-foreground">
                {result.passed 
                  ? 'You passed the quiz!'
                  : `You need ${quiz.passing_score}% to pass. Try again!`
                }
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {result.score} / {result.total_questions}
              </div>
              <div className="text-2xl text-muted-foreground mb-4">
                {Math.round(result.percentage)}%
              </div>
              <Progress value={result.percentage} className="h-3" />
            </div>

            {!isOnline && (
              <Alert>
                <AlertDescription>
                  Your quiz results will be synced with the server when you're back online.
                </AlertDescription>
              </Alert>
            )}

            {/* Question Review */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold text-lg">Review Your Answers</h3>
              {quiz.questions.map((question, index) => {
                const answer = result.answers.find(a => a.question_id === question.id);
                return (
                  <Card key={question.id} className={answer?.is_correct ? 'border-green-200' : 'border-red-200'}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {answer?.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            {index + 1}. {question.question_text}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your answer: <span className={answer?.is_correct ? 'text-green-600' : 'text-red-600'}>
                              {answer?.selected_answer}
                            </span>
                          </p>
                          {!answer?.is_correct && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct answer: {answer?.correct_answer}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => router.back()} className="flex-1">
                Back to Lessons
              </Button>
              {!result.passed && (
                <Button onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentQuestion(0);
                }} variant="outline" className="flex-1">
                  Retake Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show quiz questions
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {!isOnline && (
          <Badge variant="secondary">Offline Mode</Badge>
        )}
      </div>

      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Answered: {answeredCount} / {quiz.questions.length}
            </span>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {currentQuestion + 1}. {question.question_text}
            </h3>

            <div className="space-y-3">
              {question.options && question.options.map((optionText, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                const isSelected = answers[question.id] === optionLetter;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(question.id, optionLetter)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{optionLetter}.</span> {optionText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < quiz.questions.length}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!isOnline && (
        <Alert>
          <AlertDescription>
            You're taking this quiz offline. Your answers will be submitted when you're back online.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
