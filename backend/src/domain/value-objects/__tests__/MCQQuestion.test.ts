/**
 * MCQQuestion Value Object Unit Tests
 * 
 * Tests for MCQQuestion value object validation and behavior.
 * 
 * Requirements tested:
 * - 11.4: MCQ must have at least 2 options
 * - 11.4: MCQ must have valid correctAnswer index
 */

import { MCQQuestion } from '../MCQQuestion';

describe('MCQQuestion Value Object', () => {
  describe('create', () => {
    it('should create valid MCQQuestion with minimum 2 options', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      expect(question.getQuestionText()).toBe('What is 2+2?');
      expect(question.getOptions()).toEqual(['3', '4', '5']);
      expect(question.getCorrectAnswer()).toBe(1);
    });

    it('should create valid MCQQuestion with exactly 2 options', () => {
      const question = MCQQuestion.create(
        'Is this true?',
        ['Yes', 'No'],
        0
      );

      expect(question.getOptions()).toHaveLength(2);
      expect(question.getCorrectAnswer()).toBe(0);
    });

    it('should throw error if question text is empty', () => {
      expect(() => {
        MCQQuestion.create('', ['Option 1', 'Option 2'], 0);
      }).toThrow('Question text is required');
    });

    it('should throw error if question text is only whitespace', () => {
      expect(() => {
        MCQQuestion.create('   ', ['Option 1', 'Option 2'], 0);
      }).toThrow('Question text is required');
    });

    it('should throw error if options array is empty', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', [], 0);
      }).toThrow('MCQ must have at least 2 options');
    });

    it('should throw error if options array has only 1 option', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', ['4'], 0);
      }).toThrow('MCQ must have at least 2 options');
    });

    it('should throw error if any option is empty', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', ['3', '', '5'], 1);
      }).toThrow('Option 2: Option text is required');
    });

    it('should throw error if any option is only whitespace', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', ['3', '   ', '5'], 1);
      }).toThrow('Option 2: Option text is required');
    });

    it('should throw error if correctAnswer is negative', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', ['3', '4', '5'], -1);
      }).toThrow('MCQ correctAnswer must be a valid option index');
    });

    it('should throw error if correctAnswer is greater than options length', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', ['3', '4', '5'], 3);
      }).toThrow('MCQ correctAnswer must be a valid option index');
    });

    it('should throw error if correctAnswer is not an integer', () => {
      expect(() => {
        MCQQuestion.create('What is 2+2?', ['3', '4', '5'], 1.5);
      }).toThrow('MCQ correctAnswer must be a valid option index');
    });

    it('should accept correctAnswer at last index', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        2
      );

      expect(question.getCorrectAnswer()).toBe(2);
    });
  });

  describe('isCorrectAnswer', () => {
    it('should return true for correct answer index', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      expect(question.isCorrectAnswer(1)).toBe(true);
    });

    it('should return false for incorrect answer index', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      expect(question.isCorrectAnswer(0)).toBe(false);
      expect(question.isCorrectAnswer(2)).toBe(false);
    });
  });

  describe('getCorrectAnswerText', () => {
    it('should return the text of the correct answer', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      expect(question.getCorrectAnswerText()).toBe('4');
    });
  });

  describe('toObject', () => {
    it('should convert to plain object with type MCQ', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      const obj = question.toObject();

      expect(obj).toEqual({
        type: 'MCQ',
        questionText: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: 1,
      });
    });
  });

  describe('equals', () => {
    it('should return true for identical questions', () => {
      const question1 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );
      const question2 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      expect(question1.equals(question2)).toBe(true);
    });

    it('should return false for different question text', () => {
      const question1 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );
      const question2 = MCQQuestion.create(
        'What is 3+3?',
        ['3', '4', '5'],
        1
      );

      expect(question1.equals(question2)).toBe(false);
    });

    it('should return false for different options', () => {
      const question1 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );
      const question2 = MCQQuestion.create(
        'What is 2+2?',
        ['2', '4', '6'],
        1
      );

      expect(question1.equals(question2)).toBe(false);
    });

    it('should return false for different correct answer', () => {
      const question1 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );
      const question2 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        0
      );

      expect(question1.equals(question2)).toBe(false);
    });

    it('should return false for different number of options', () => {
      const question1 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );
      const question2 = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4'],
        1
      );

      expect(question1.equals(question2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of options array', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      const options = question.getOptions();

      // TypeScript should prevent this, but test runtime behavior
      expect(() => {
        (options as any).push('6');
      }).toThrow();
    });

    it('should return new array copy in toObject', () => {
      const question = MCQQuestion.create(
        'What is 2+2?',
        ['3', '4', '5'],
        1
      );

      const obj1 = question.toObject();
      const obj2 = question.toObject();

      // Should be equal but not same reference
      expect(obj1.options).toEqual(obj2.options);
      expect(obj1.options).not.toBe(obj2.options);
    });
  });
});
