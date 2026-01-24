/**
 * QuizResults Component
 * 
 * Component for students to view their quiz submission results.
 * 
 * Requirements:
 * - 12.10: Display submitted quiz with answers and grade/feedback
 */

import React, { useState, useEffect } from 'react';
import { Button, Spinner, ErrorMessage } from '../shared';
import { quizService } from '../../services';
import type { QuizSubmission, Quiz, ApiError } from '../../types';

interface QuizResultsProps {
  quizId: string;
  courseId: string;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ quizId, courseId }) => {
  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load quiz and submission data
   */
  useEffect(() => {
    loadQuizResults();
  }, [quizId]);

  /**
   * Load quiz and submission from server
   */
  const loadQuizResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load quiz details and submission in parallel
      const [quizData, submissionData] = await Promise.all([
        quizService.getQuiz(quizId),
        quizService.getMySubmission(quizId),
      ]);

      setQuiz(quizData);
      setSubmission(submissionData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get answer for a question
   */
  const getAnswer = (questionIndex: number): string | number | undefined => {
    if (!submission) return undefined;
    const answer = submission.answers.find((a) => a.questionIndex === questionIndex);
    return answer?.answer;
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get grade color based on score
   */
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 75) return 'text-blue-600';
    if (grade >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !quiz || !submission) {
    return (
      <div className="py-6">
        <ErrorMessage message={error || 'Quiz results not found'} />
        <Button
          variant="secondary"
          onClick={loadQuizResults}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const isGraded = submission.status === 'GRADED' && submission.grade !== null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {quiz.title}
            </h2>
            <p className="text-gray-600 mb-4">{quiz.description}</p>
            
            {/* Submission Info */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Submitted:</span>
                <span>{submission.submittedAt ? formatDate(submission.submittedAt) : 'Not submitted'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  isGraded
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isGraded ? 'Graded' : 'Submitted'}
                </span>
              </div>
            </div>
          </div>

          {/* Grade Display */}
          {isGraded && (
            <div className="ml-6 text-center border-2 border-gray-200 rounded-lg p-4 min-w-[160px]">
              <p className="text-sm text-gray-600 mb-1">Your Grade</p>
              <p className={`text-5xl font-bold ${getGradeColor(submission.grade!)}`}>
                {submission.grade}
              </p>
              <p className="text-sm text-gray-500 mt-1">out of 100</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {isGraded && submission.feedback && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
          </div>
        )}
      </div>

      {/* Questions and Answers */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Your Answers</h3>

        {quiz.questions.map((question, index) => {
          const answer = getAnswer(index);
          const isAnswered = answer !== undefined;

          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Question {index + 1}
                </h4>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  {question.type}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">
                {question.questionText}
              </p>

              {/* Answer Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                
                {!isAnswered ? (
                  <p className="text-gray-500 italic">No answer provided</p>
                ) : question.type === 'MCQ' && question.options ? (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = answer === optionIndex;
                      return (
                        <div
                          key={optionIndex}
                          className={`flex items-center gap-3 p-3 border rounded ${
                            isSelected
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}>
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-gray-800 whitespace-pre-wrap">{answer as string}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="secondary"
          onClick={() => window.location.href = `/courses/${courseId}`}
        >
          Back to Course
        </Button>
      </div>
    </div>
  );
};

export default QuizResults;
