/**
 * CreateQuiz Component
 * 
 * Form for creating a new quiz with question builder.
 * Supports MCQ and Essay question types.
 * Teacher-only component.
 * 
 * Requirements:
 * - 11.1: Quiz creation with title, description, due date, and time limit
 * - 11.2: Add multiple choice questions (2+ options, 1 correct answer)
 * - 11.3: Add essay questions with rich text
 * - 11.4: Questions (MCQ and Essay)
 * - 11.5: Timezone-aware due dates
 */

import React, { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Spinner } from '../shared/Spinner';
import * as quizService from '../../services/quizService';
import { Quiz, QuestionType, Question, ApiError } from '../../types';

interface CreateQuizProps {
  courseId: string;
  onSuccess?: (quiz: Quiz) => void;
  onCancel?: () => void;
}

export const CreateQuiz: React.FC<CreateQuizProps> = ({
  courseId,
  onSuccess,
  onCancel,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('60');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Question builder state
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [currentQuestionType, setCurrentQuestionType] = useState<QuestionType>(QuestionType.MCQ);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [currentOptions, setCurrentOptions] = useState<string[]>(['', '']);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<number>(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Add a new option to MCQ question
   */
  const handleAddOption = () => {
    if (currentOptions.length < 6) {
      setCurrentOptions([...currentOptions, '']);
    }
  };

  /**
   * Remove an option from MCQ question
   */
  const handleRemoveOption = (index: number) => {
    if (currentOptions.length > 2) {
      const newOptions = currentOptions.filter((_, i) => i !== index);
      setCurrentOptions(newOptions);
      
      // Adjust correct answer if needed
      if (currentCorrectAnswer >= newOptions.length) {
        setCurrentCorrectAnswer(newOptions.length - 1);
      }
    }
  };

  /**
   * Update option text
   */
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    setCurrentOptions(newOptions);
  };

  /**
   * Validate question builder
   */
  const validateQuestion = (): boolean => {
    if (!currentQuestionText.trim()) {
      setError('Question text is required');
      return false;
    }

    if (currentQuestionType === QuestionType.MCQ) {
      // Check if all options are filled
      if (currentOptions.some(opt => !opt.trim())) {
        setError('All options must be filled');
        return false;
      }

      // Check for duplicate options
      const uniqueOptions = new Set(currentOptions.map(opt => opt.trim().toLowerCase()));
      if (uniqueOptions.size !== currentOptions.length) {
        setError('Options must be unique');
        return false;
      }
    }

    return true;
  };

  /**
   * Add question to quiz
   */
  const handleAddQuestion = () => {
    if (!validateQuestion()) {
      return;
    }

    const newQuestion: Question = {
      type: currentQuestionType,
      questionText: currentQuestionText.trim(),
    };

    if (currentQuestionType === QuestionType.MCQ) {
      newQuestion.options = currentOptions.map(opt => opt.trim());
      newQuestion.correctAnswer = currentCorrectAnswer;
    }

    setQuestions([...questions, newQuestion]);
    
    // Reset question builder
    setCurrentQuestionText('');
    setCurrentOptions(['', '']);
    setCurrentCorrectAnswer(0);
    setShowQuestionBuilder(false);
    setError('');
  };

  /**
   * Remove question from quiz
   */
  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length > 2000) {
      errors.description = 'Description must not exceed 2,000 characters';
    }
    
    if (!dueDate) {
      errors.dueDate = 'Due date is required';
    } else {
      const dueDateObj = new Date(dueDate);
      if (dueDateObj <= new Date()) {
        errors.dueDate = 'Due date must be in the future';
      }
    }
    
    const timeLimitNum = parseInt(timeLimit);
    if (!timeLimit || isNaN(timeLimitNum) || timeLimitNum <= 0) {
      errors.timeLimit = 'Time limit must be a positive number';
    } else if (timeLimitNum > 300) {
      errors.timeLimit = 'Time limit must not exceed 300 minutes (5 hours)';
    }
    
    if (questions.length === 0) {
      errors.questions = 'At least one question is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Clear validation errors
    setValidationErrors({});
    setLoading(true);
    
    try {
      const quiz = await quizService.createQuiz(courseId, {
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString(),
        timeLimit: parseInt(timeLimit),
        questions,
      });
      
      // Success callback
      if (onSuccess) {
        onSuccess(quiz);
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setTimeLimit('60');
      setQuestions([]);
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle validation errors from server
      if (apiError.code === 'VALIDATION_FAILED' && apiError.details) {
        setValidationErrors(apiError.details);
      } else {
        setError(apiError.message || 'Failed to create quiz. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get minimum date for due date picker (tomorrow)
   */
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Create New Quiz
      </h2>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Create Quiz Form */}
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <Input
          label="Quiz Title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Midterm Exam"
          error={validationErrors.title}
          required
          disabled={loading}
          maxLength={200}
        />

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block font-medium text-gray-800 mb-2">
            Description
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter quiz description and instructions..."
            required
            disabled={loading}
            rows={4}
            maxLength={2000}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
              validationErrors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary'
            } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            {description.length}/2,000 characters
          </p>
        </div>

        {/* Due Date */}
        <Input
          label="Available Until (Close Time)"
          name="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={validationErrors.dueDate}
          required
          disabled={loading}
          min={getMinDate()}
        />
        <p className="text-sm text-gray-600 -mt-3 mb-4">
          Students can start the quiz anytime before this date/time. Timer starts when they begin.
        </p>

        {/* Time Limit */}
        <Input
          label="Time Limit (minutes)"
          name="timeLimit"
          type="number"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="60"
          error={validationErrors.timeLimit}
          required
          disabled={loading}
          min="1"
          max="300"
        />

        {/* Questions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block font-medium text-gray-800">
              Questions
              <span className="text-red-500 ml-1">*</span>
            </label>
            {!showQuestionBuilder && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowQuestionBuilder(true)}
                disabled={loading}
                size="sm"
              >
                + Add Question
              </Button>
            )}
          </div>

          {validationErrors.questions && (
            <p className="text-sm text-red-600 mb-4">{validationErrors.questions}</p>
          )}

          {/* Question List */}
          {questions.length > 0 && (
            <div className="space-y-4 mb-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {question.type === QuestionType.MCQ ? 'Multiple Choice' : 'Essay'}
                        </span>
                        <span className="text-sm text-gray-600">Question {index + 1}</span>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{question.questionText}</p>
                      
                      {question.type === QuestionType.MCQ && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                                optIndex === question.correctAnswer
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className="text-gray-700">{option}</span>
                              {optIndex === question.correctAnswer && (
                                <span className="text-green-600 text-sm">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveQuestion(index)}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Question Builder */}
          {showQuestionBuilder && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Question</h3>

              {/* Question Type */}
              <div className="mb-4">
                <label htmlFor="questionType" className="block font-medium text-gray-800 mb-2">
                  Question Type
                </label>
                <select
                  id="questionType"
                  value={currentQuestionType}
                  onChange={(e) => setCurrentQuestionType(e.target.value as QuestionType)}
                  className="w-full h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={QuestionType.MCQ}>Multiple Choice</option>
                  <option value={QuestionType.ESSAY}>Essay</option>
                </select>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label htmlFor="questionText" className="block font-medium text-gray-800 mb-2">
                  Question Text
                </label>
                <textarea
                  id="questionText"
                  value={currentQuestionText}
                  onChange={(e) => setCurrentQuestionText(e.target.value)}
                  placeholder="Enter your question here..."
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* MCQ Options */}
              {currentQuestionType === QuestionType.MCQ && (
                <div className="mb-4">
                  <label className="block font-medium text-gray-800 mb-2">
                    Answer Options (select correct answer)
                  </label>
                  <div className="space-y-2">
                    {currentOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentCorrectAnswer === index}
                          onChange={() => setCurrentCorrectAnswer(index)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 h-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        {currentOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {currentOptions.length < 6 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddOption}
                      className="mt-2"
                    >
                      + Add Option
                    </Button>
                  )}
                </div>
              )}

              {/* Question Builder Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddQuestion}
                >
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowQuestionBuilder(false);
                    setCurrentQuestionText('');
                    setCurrentOptions(['', '']);
                    setCurrentCorrectAnswer(0);
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Creating Quiz...
              </span>
            ) : (
              'Create Quiz'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
