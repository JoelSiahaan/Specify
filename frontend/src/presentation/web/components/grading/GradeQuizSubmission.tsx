/**
 * GradeQuizSubmission Component (Teacher View)
 * 
 * Displays quiz questions, student answers, and provides grading interface for teachers.
 * Includes per-question point assignment, total score calculation, and feedback editor.
 * 
 * Features:
 * - Display quiz questions with student answers
 * - Manual point assignment per question
 * - Total score calculation with warning if ≠ 100
 * - Rich text editor for feedback
 * - Support for MCQ and Essay questions
 * 
 * Requirements: 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10
 */

import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '../shared/RichTextEditor';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';
import { formatDueDate } from '../../utils/dateFormatter';
import { getQuizSubmission, gradeQuizSubmission, updateQuizGrade } from '../../services/quizService';
import { getQuiz } from '../../services/quizService';
import type { QuizSubmission, Quiz, Answer } from '../../types';
import { QuizSubmissionStatus } from '../../types/quiz.types';

interface GradeQuizSubmissionProps {
  submissionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface QuestionGrade {
  questionIndex: number;
  points: string;
  error?: string;
}

export const GradeQuizSubmission: React.FC<GradeQuizSubmissionProps> = ({
  submissionId,
  onSuccess,
  onCancel,
}) => {
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [questionGrades, setQuestionGrades] = useState<QuestionGrade[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  // Load submission and quiz details
  useEffect(() => {
    loadSubmissionAndQuiz();
  }, [submissionId]);

  // Calculate total points whenever question grades change
  useEffect(() => {
    const total = questionGrades.reduce((sum, qg) => {
      const points = parseFloat(qg.points);
      return sum + (isNaN(points) ? 0 : points);
    }, 0);
    setTotalPoints(total);
    setShowWarning(Math.abs(total - 100) > 0.01); // Show warning if not equal to 100 (with small tolerance for floating point)
  }, [questionGrades]);

  const loadSubmissionAndQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load submission
      const submissionData = await getQuizSubmission(submissionId);
      setSubmission(submissionData);
      
      // Load quiz to get questions
      const quizData = await getQuiz(submissionData.quizId);
      setQuiz(quizData);
      
      // Initialize question grades
      const initialGrades: QuestionGrade[] = quizData.questions.map((_, index) => ({
        questionIndex: index,
        points: '',
      }));
      setQuestionGrades(initialGrades);
      
      // Pre-fill feedback if already graded
      if (submissionData.feedback) {
        setFeedback(submissionData.feedback);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (questionIndex: number, value: string) => {
    setQuestionGrades(prev => prev.map(qg => {
      if (qg.questionIndex === questionIndex) {
        // Validate points
        let error: string | undefined;
        if (value.trim() && !isNaN(parseFloat(value))) {
          const points = parseFloat(value);
          if (points < 0) {
            error = 'Points cannot be negative';
          }
        }
        
        return { ...qg, points: value, error };
      }
      return qg;
    }));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const updatedGrades = questionGrades.map(qg => {
      let error: string | undefined;
      
      if (!qg.points.trim()) {
        error = 'Points required';
        isValid = false;
      } else {
        const points = parseFloat(qg.points);
        if (isNaN(points)) {
          error = 'Invalid number';
          isValid = false;
        } else if (points < 0) {
          error = 'Cannot be negative';
          isValid = false;
        }
      }
      
      return { ...qg, error };
    });
    
    setQuestionGrades(updatedGrades);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!submission || !quiz) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Calculate total grade from question points
      const grade = questionGrades.reduce((sum, qg) => {
        return sum + parseFloat(qg.points);
      }, 0);
      
      const gradeData = {
        grade: Math.round(grade * 100) / 100, // Round to 2 decimal places
        feedback: feedback.trim() || undefined,
      };
      
      // Use appropriate endpoint based on whether submission is already graded
      const isAlreadyGraded = submission.status === QuizSubmissionStatus.GRADED;
      const updatedSubmission = isAlreadyGraded
        ? await updateQuizGrade(submissionId, gradeData)
        : await gradeQuizSubmission(submissionId, gradeData);
      
      setSubmission(updatedSubmission);
      setSuccessMessage(
        isAlreadyGraded
          ? 'Grade updated successfully'
          : 'Quiz graded successfully'
      );
      
      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const getStudentAnswer = (questionIndex: number): Answer | undefined => {
    return submission?.answers.find(a => a.questionIndex === questionIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="large" />
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!submission || !quiz) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <p className="text-sm text-red-700">Submission or quiz not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <div className="border-l-4 border-green-500 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div className="flex-1">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Submission Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Grade Quiz Submission</h2>
          {submission.status === QuizSubmissionStatus.GRADED && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              <span>✓</span>
              <span>Graded</span>
            </span>
          )}
        </div>

        {/* Quiz info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
          <p className="text-sm text-gray-600">{quiz.description}</p>
        </div>

        {/* Submission metadata */}
        <div className="space-y-2 text-sm text-gray-600">
          {submission.startedAt && (
            <p>
              <span className="font-medium">Started:</span>{' '}
              {formatDueDate(submission.startedAt.toString())}
            </p>
          )}
          {submission.submittedAt && (
            <p>
              <span className="font-medium">Submitted:</span>{' '}
              {formatDueDate(submission.submittedAt.toString())}
            </p>
          )}
          {submission.status === QuizSubmissionStatus.GRADED && submission.grade !== null && (
            <p>
              <span className="font-medium">Current Grade:</span>{' '}
              <span className="text-lg font-semibold text-green-600">{submission.grade}</span>
              <span className="text-gray-500"> / 100</span>
            </p>
          )}
        </div>
      </div>

      {/* Questions and Answers */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions and Student Answers</h3>

        <div className="space-y-6">
          {quiz.questions.map((question, index) => {
            const studentAnswer = getStudentAnswer(index);
            const questionGrade = questionGrades.find(qg => qg.questionIndex === index);

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {/* Question header */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Question {index + 1}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({question.type === 'MCQ' ? 'Multiple Choice' : 'Essay'})
                    </span>
                  </h4>
                </div>

                {/* Question text */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-gray-800">{question.questionText}</p>
                </div>

                {/* MCQ Options (if applicable) */}
                {question.type === 'MCQ' && question.options && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isStudentAnswer = studentAnswer && studentAnswer.answer === optionIndex;
                        const isCorrectAnswer = question.correctAnswer === optionIndex;
                        
                        return (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              isStudentAnswer
                                ? isCorrectAnswer
                                  ? 'bg-green-50 border border-green-300'
                                  : 'bg-red-50 border border-red-300'
                                : isCorrectAnswer
                                ? 'bg-blue-50 border border-blue-300'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span className="text-gray-800">{option}</span>
                              {isStudentAnswer && (
                                <span className="ml-auto text-sm font-semibold">
                                  {isCorrectAnswer ? (
                                    <span className="text-green-600">✓ Student Answer</span>
                                  ) : (
                                    <span className="text-red-600">✗ Student Answer</span>
                                  )}
                                </span>
                              )}
                              {!isStudentAnswer && isCorrectAnswer && (
                                <span className="ml-auto text-sm font-semibold text-blue-600">
                                  ✓ Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Essay Answer */}
                {question.type === 'ESSAY' && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Student Answer:</p>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap">
                      {studentAnswer && typeof studentAnswer.answer === 'string'
                        ? studentAnswer.answer
                        : <span className="text-gray-500 italic">No answer provided</span>
                      }
                    </div>
                  </div>
                )}

                {/* Points input */}
                <div className="mt-4">
                  <Input
                    label={`Points for Question ${index + 1}`}
                    name={`points-${index}`}
                    type="number"
                    value={questionGrade?.points || ''}
                    onChange={(e) => handlePointsChange(index, e.target.value)}
                    placeholder="Enter points"
                    min="0"
                    step="0.01"
                    error={questionGrade?.error}
                    required
                    disabled={saving}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grading Form */}
      <form onSubmit={handleSubmit} noValidate className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Score and Feedback</h3>

        {/* Total score display */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-700">Total Score:</span>
            <span className={`text-3xl font-bold ${
              showWarning ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {totalPoints.toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1 text-right">out of 100</div>
        </div>

        {/* Warning if total ≠ 100 */}
        {showWarning && (
          <div className="mb-6 border-l-4 border-yellow-500 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Warning: Total points do not equal 100</p>
                <p>
                  The sum of points assigned to all questions is {totalPoints.toFixed(2)}, not 100.
                  Please verify that the points are distributed correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback editor */}
        <div className="mb-6">
          <label className="block font-medium text-gray-800 mb-2">
            Feedback <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <RichTextEditor
            value={feedback}
            onChange={setFeedback}
            placeholder="Provide overall feedback to the student..."
            maxLength={5000}
            disabled={saving}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size="small" className="mr-2" />
                Saving...
              </>
            ) : submission.status === QuizSubmissionStatus.GRADED ? (
              'Update Grade'
            ) : (
              'Save Grade'
            )}
          </Button>
        </div>

        {/* Manual grading info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Manual Grading:</p>
              <p>
                All questions require manual point assignment. The total score is calculated
                by summing the points assigned to each question. You can assign any points
                per question, but the system will warn if the total does not equal 100.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GradeQuizSubmission;
