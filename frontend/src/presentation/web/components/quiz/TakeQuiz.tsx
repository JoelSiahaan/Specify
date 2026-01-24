/**
 * TakeQuiz Component
 * 
 * Component for students to take a quiz with timer, auto-save, and submission.
 * 
 * Requirements:
 * - 12.1: Display quiz questions
 * - 12.2: Implement countdown timer (visible to student)
 * - 12.3: Auto-save answers to localStorage every 30 seconds
 * - 12.4: Auto-save answers to server every 2 minutes
 * - 12.5: Auto-submit when timer expires
 * - 12.6: Prevent multiple submissions
 * - 12.7: Handle network errors gracefully (retry auto-save)
 * - 12.8: Show submission confirmation
 * - 12.9: Display quiz info before starting
 * - 12.10: Navigate to results after submission
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Spinner, ErrorMessage } from '../shared';
import { quizService } from '../../services';
import type { QuizAttempt, Answer, ApiError } from '../../types';

interface TakeQuizProps {
  quizId: string;
  courseId: string;
}

/**
 * Format time in MM:SS format
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get timer color based on remaining time
 */
const getTimerColor = (seconds: number, totalSeconds: number): string => {
  const percentage = (seconds / totalSeconds) * 100;
  
  if (percentage <= 10) {
    return 'text-red-600 border-red-500'; // Critical (< 10%)
  } else if (percentage <= 25) {
    return 'text-yellow-600 border-yellow-500'; // Warning (< 25%)
  } else {
    return 'text-gray-900 border-gray-300'; // Normal
  }
};

export const TakeQuiz: React.FC<TakeQuizProps> = ({ quizId, courseId }) => {
  // State
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Refs for intervals
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localStorageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const serverSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // LocalStorage key
  const localStorageKey = `quiz_${quizId}_answers`;

  /**
   * Load quiz attempt and restore answers from localStorage
   */
  useEffect(() => {
    loadQuizAttempt();

    // Cleanup intervals on unmount
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (localStorageIntervalRef.current) clearInterval(localStorageIntervalRef.current);
      if (serverSaveIntervalRef.current) clearInterval(serverSaveIntervalRef.current);
      if (autoSaveRetryTimeoutRef.current) clearTimeout(autoSaveRetryTimeoutRef.current);
    };
  }, [quizId]);

  /**
   * Load quiz attempt from server
   */
  const loadQuizAttempt = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start quiz (or resume if already started)
      const attempt = await quizService.startQuiz(quizId);
      setQuizAttempt(attempt);
      setRemainingSeconds(attempt.remainingTimeSeconds);

      // Priority: Server answers over localStorage (Edge Case: Multi-device sync)
      // Use server answers as source of truth, localStorage is backup only
      if (attempt.currentAnswers && attempt.currentAnswers.length > 0) {
        // Server has answers (resumed quiz) - use server data
        setAnswers(attempt.currentAnswers);
        // Update localStorage with server data to sync
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(attempt.currentAnswers));
        } catch (err) {
          console.error('Failed to sync localStorage with server:', err);
        }
      } else {
        // Server has no answers (new quiz) - check localStorage for recovery
        const savedAnswers = localStorage.getItem(localStorageKey);
        if (savedAnswers) {
          try {
            const parsed = JSON.parse(savedAnswers);
            setAnswers(parsed);
          } catch {
            // Invalid JSON, start fresh
            setAnswers([]);
          }
        } else {
          setAnswers([]);
        }
      }

      // Check if time already expired (Edge Case: Resume after timeout)
      if (attempt.remainingTimeSeconds <= 0) {
        // Time expired - show message and auto-submit
        setError('Quiz time has expired. Submitting your answers...');
        // Give user 2 seconds to see the message
        setTimeout(() => {
          handleAutoSubmit();
        }, 2000);
        return;
      }

      // Start timer
      startTimer();

      // Start auto-save intervals
      startAutoSaveIntervals();
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle time expired error from backend
      if (apiError.code === 'QUIZ_TIME_EXPIRED') {
        setError('Quiz time has expired and has been automatically submitted.');
        // Redirect to course page after 3 seconds
        setTimeout(() => {
          window.location.href = `/courses/${courseId}`;
        }, 3000);
      } else {
        setError(apiError.message || 'Failed to load quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start countdown timer
   */
  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Start auto-save intervals
   */
  const startAutoSaveIntervals = () => {
    // Auto-save to localStorage every 30 seconds
    if (localStorageIntervalRef.current) clearInterval(localStorageIntervalRef.current);
    localStorageIntervalRef.current = setInterval(() => {
      saveToLocalStorage();
    }, 30000); // 30 seconds

    // Auto-save to server every 2 minutes
    if (serverSaveIntervalRef.current) clearInterval(serverSaveIntervalRef.current);
    serverSaveIntervalRef.current = setInterval(() => {
      saveToServer();
    }, 120000); // 2 minutes
  };

  /**
   * Save answers to localStorage
   */
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(answers));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [answers, localStorageKey]);

  /**
   * Save answers to server with retry logic
   */
  const saveToServer = useCallback(async (retryCount = 0) => {
    try {
      setAutoSaveError(null);
      await quizService.autoSaveQuizAnswers(quizId, { answers });
      setLastSaved(new Date());
    } catch (err) {
      const apiError = err as ApiError;
      setAutoSaveError('Auto-save failed. Retrying...');

      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        autoSaveRetryTimeoutRef.current = setTimeout(() => {
          saveToServer(retryCount + 1);
        }, delay);
      } else {
        setAutoSaveError('Auto-save failed. Your answers are saved locally.');
      }
    }
  }, [quizId, answers]);

  /**
   * Handle answer change
   */
  const handleAnswerChange = (questionIndex: number, answer: string | number) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionIndex === questionIndex);
      if (existing) {
        return prev.map((a) =>
          a.questionIndex === questionIndex ? { ...a, answer } : a
        );
      } else {
        return [...prev, { questionIndex, answer }];
      }
    });

    // Save to localStorage immediately on change
    saveToLocalStorage();
  };

  /**
   * Handle manual submit
   */
  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit your quiz? You cannot change your answers after submission.')) {
      return;
    }

    await submitQuiz();
  };

  /**
   * Handle auto-submit when timer expires
   */
  const handleAutoSubmit = async () => {
    await submitQuiz(true); // Pass true to indicate auto-submit
  };

  /**
   * Submit quiz to server
   * 
   * @param isAutoSubmit - Whether this is an auto-submit (for retry logic)
   * @param retryCount - Current retry attempt (for auto-submit retry)
   */
  const submitQuiz = async (isAutoSubmit: boolean = false, retryCount: number = 0) => {
    try {
      setSubmitting(true);
      setError(null);

      // Clear intervals
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (localStorageIntervalRef.current) clearInterval(localStorageIntervalRef.current);
      if (serverSaveIntervalRef.current) clearInterval(serverSaveIntervalRef.current);

      // Submit quiz
      await quizService.submitQuiz(quizId, { answers });

      // Clear localStorage
      localStorage.removeItem(localStorageKey);

      // Mark as submitted
      setSubmitted(true);

      // Navigate to course page after 2 seconds
      setTimeout(() => {
        window.location.href = `/courses/${courseId}`;
      }, 2000);
    } catch (err) {
      const apiError = err as ApiError;
      
      // Auto-submit retry logic (Edge Case: Network failure during auto-submit)
      if (isAutoSubmit && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setError(`Auto-submit failed. Retrying in ${delay / 1000} seconds... (Attempt ${retryCount + 1}/3)`);
        
        setTimeout(() => {
          submitQuiz(true, retryCount + 1);
        }, delay);
      } else if (isAutoSubmit && retryCount >= 3) {
        // All retries failed
        setError('Auto-submit failed after 3 attempts. Please check your connection and try submitting manually.');
        setSubmitting(false);
        
        // Show submit button for manual retry
        // Timer already stopped, so student can manually submit
      } else {
        // Manual submit failed
        setError(apiError.message || 'Failed to submit quiz');
        setSubmitting(false);
      }
    }
  };

  /**
   * Get answer for a question
   */
  const getAnswer = (questionIndex: number): string | number | undefined => {
    const answer = answers.find((a) => a.questionIndex === questionIndex);
    return answer?.answer;
  };

  /**
   * Check if all questions are answered
   */
  const allQuestionsAnswered = (): boolean => {
    if (!quizAttempt) return false;
    return quizAttempt.questions.every((q) =>
      answers.some((a) => a.questionIndex === q.questionIndex)
    );
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
  if (error && !quizAttempt) {
    return (
      <div className="py-6">
        <ErrorMessage message={error} />
        <Button
          variant="secondary"
          onClick={loadQuizAttempt}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Submission success state
  if (submitted) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl mb-4 block">✅</span>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz Submitted!</h3>
        <p className="text-gray-600 mb-6">
          Your quiz has been submitted successfully. Your teacher will grade it and provide feedback soon.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to course page...
        </p>
        <Spinner size="md" />
      </div>
    );
  }

  if (!quizAttempt) return null;

  const totalSeconds = quizAttempt.timeLimit * 60;
  const timerColor = getTimerColor(remainingSeconds, totalSeconds);
  const isTimeCritical = remainingSeconds <= totalSeconds * 0.1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Timer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {quizAttempt.title}
            </h2>
            <p className="text-gray-600">{quizAttempt.description}</p>
          </div>

          {/* Timer */}
          <div
            className={`ml-6 border-2 rounded-lg p-4 min-w-[160px] text-center ${timerColor} ${
              isTimeCritical ? 'animate-pulse' : ''
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">⏱️</span>
              <span className="text-sm font-medium">Time Remaining</span>
            </div>
            <div className="text-3xl font-bold">{formatTime(remainingSeconds)}</div>
          </div>
        </div>

        {/* Auto-save status */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            {autoSaveError ? (
              <span className="text-yellow-600">⚠️ {autoSaveError}</span>
            ) : lastSaved ? (
              <span className="text-gray-600">
                ✓ Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-gray-600">Auto-save enabled</span>
            )}
          </div>
          <div className="text-gray-600">
            {answers.length} of {quizAttempt.questions.length} questions answered
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* Questions */}
      <div className="space-y-6">
        {quizAttempt.questions.map((question, index) => {
          const currentAnswer = getAnswer(question.questionIndex);
          const isAnswered = currentAnswer !== undefined;

          return (
            <div
              key={question.questionIndex}
              className={`bg-white border rounded-lg p-6 ${
                isAnswered ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Question {index + 1}
                  {isAnswered && (
                    <span className="ml-2 text-green-600 text-sm">✓ Answered</span>
                  )}
                </h3>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  {question.type}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">
                {question.questionText}
              </p>

              {/* Answer Input */}
              {question.type === 'MCQ' && question.options ? (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${question.questionIndex}`}
                        value={optionIndex}
                        checked={currentAnswer === optionIndex}
                        onChange={() => handleAnswerChange(question.questionIndex, optionIndex)}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-800">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={(currentAnswer as string) || ''}
                  onChange={(e) => handleAnswerChange(question.questionIndex, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            {!allQuestionsAnswered() && (
              <p className="text-yellow-600 text-sm">
                ⚠️ You haven't answered all questions yet
              </p>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
