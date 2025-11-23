'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

interface QuestionOption {
  option_text: string;
  is_correct: boolean;
}

interface Question {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  correct_answer: string;
  points: number;
  options: QuestionOption[];
}

export default function NewQuizPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = parseInt(params.id as string);
  const lessonId = parseInt(params.lessonId as string);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_limit: '30',
    passing_score: '60',
    max_attempts: '3'
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: '',
    question_type: 'multiple_choice',
    correct_answer: '',
    points: 1,
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    if (!currentQuestion.question_text) {
      alert('Please enter a question text');
      return;
    }

    if (currentQuestion.question_type === 'multiple_choice') {
      const hasCorrectAnswer = currentQuestion.options.some(opt => opt.is_correct);
      if (!hasCorrectAnswer) {
        alert('Please mark at least one option as correct');
        return;
      }
      const allOptionsFilled = currentQuestion.options.every(opt => opt.option_text.trim());
      if (!allOptionsFilled) {
        alert('Please fill in all options');
        return;
      }
    } else if (currentQuestion.question_type === 'true_false') {
      if (!currentQuestion.correct_answer) {
        alert('Please select the correct answer');
        return;
      }
    } else if (currentQuestion.question_type === 'short_answer') {
      if (!currentQuestion.correct_answer) {
        alert('Please enter the correct answer');
        return;
      }
    }

    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      correct_answer: '',
      points: 1,
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { option_text: '', is_correct: false }]
    });
  };

  const updateOption = (index: number, field: 'option_text' | 'is_correct', value: string | boolean) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length <= 2) {
      alert('You must have at least 2 options');
      return;
    }
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const quizData = {
        lesson_id: lessonId,
        title: formData.title,
        description: formData.description,
        time_limit: parseInt(formData.time_limit),
        passing_score: parseInt(formData.passing_score),
        max_attempts: parseInt(formData.max_attempts),
        questions: questions.map((q, index) => ({
          ...q,
          order_number: index + 1
        }))
      };

      await api.createQuiz(quizData);
      router.push(`/teacher/subjects/${subjectId}/lessons/${lessonId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Quiz</CardTitle>
          <CardDescription>
            Add a quiz to test student understanding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quiz Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">Quiz Settings</h3>
              
              <div>
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Chapter 1 Quiz"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the quiz"
                  rows={2}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    value={formData.time_limit}
                    onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                    min="1"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="passing_score">Passing Score (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                    min="0"
                    max="100"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="max_attempts">Max Attempts</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                    min="1"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Added Questions */}
            {questions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Questions ({questions.length})</h3>
                {questions.map((q, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge>Q{index + 1}</Badge>
                          <Badge variant="outline">{q.question_type.replace('_', ' ')}</Badge>
                          <Badge variant="secondary">{q.points} pt(s)</Badge>
                        </div>
                        <p className="mt-2 font-medium">{q.question_text}</p>
                        {q.question_type === 'multiple_choice' && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className={opt.is_correct ? 'text-green-600 font-semibold' : ''}>
                                  {String.fromCharCode(65 + i)}. {opt.option_text}
                                  {opt.is_correct && ' ✓'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.question_type !== 'multiple_choice' && (
                          <p className="mt-2 text-sm text-green-600">
                            Answer: {q.correct_answer}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Question Form */}
            <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
              <h3 className="font-semibold">Add New Question</h3>

              <div>
                <Label htmlFor="question_type">Question Type</Label>
                <Select
                  value={currentQuestion.question_type}
                  onValueChange={(value: any) => 
                    setCurrentQuestion({
                      ...currentQuestion,
                      question_type: value,
                      correct_answer: '',
                      options: value === 'multiple_choice' 
                        ? [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }]
                        : []
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question_text">Question Text</Label>
                <Textarea
                  id="question_text"
                  value={currentQuestion.question_text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>

              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="space-y-3">
                  <Label>Options</Label>
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={option.option_text}
                        onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                      <Switch
                        checked={option.is_correct}
                        onCheckedChange={(checked: boolean) => updateOption(index, 'is_correct', checked)}
                      />
                      <Label className="text-xs">Correct</Label>
                      {currentQuestion.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              )}

              {currentQuestion.question_type === 'true_false' && (
                <div>
                  <Label htmlFor="correct_answer">Correct Answer</Label>
                  <Select
                    value={currentQuestion.correct_answer}
                    onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, correct_answer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {currentQuestion.question_type === 'short_answer' && (
                <div>
                  <Label htmlFor="correct_answer_text">Correct Answer</Label>
                  <Input
                    id="correct_answer_text"
                    value={currentQuestion.correct_answer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                    placeholder="Enter the correct answer"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                  min="1"
                  className="w-32"
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={addQuestion}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || questions.length === 0} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Create Quiz (${questions.length} questions)`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
