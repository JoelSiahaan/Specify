/**
 * EssayQuestion Value Object Unit Tests
 * 
 * Tests for EssayQuestion value object validation and behavior.
 * 
 * Requirements tested:
 * - 11.4: Essay questions require question text
 */

import { EssayQuestion } from '../EssayQuestion.js';

describe('EssayQuestion Value Object', () => {
  describe('create', () => {
    it('should create valid EssayQuestion with question text', () => {
      const question = EssayQuestion.create('Explain the concept of polymorphism.');

      expect(question.getQuestionText()).toBe('Explain the concept of polymorphism.');
    });

    it('should create valid EssayQuestion with long text', () => {
      const longText = 'Describe the differences between object-oriented programming and functional programming. Provide examples of each paradigm and explain when you would use one over the other.';
      const question = EssayQuestion.create(longText);

      expect(question.getQuestionText()).toBe(longText);
    });

    it('should throw error if question text is empty', () => {
      expect(() => {
        EssayQuestion.create('');
      }).toThrow('Question text is required');
    });

    it('should throw error if question text is only whitespace', () => {
      expect(() => {
        EssayQuestion.create('   ');
      }).toThrow('Question text is required');
    });

    it('should throw error if question text is only tabs', () => {
      expect(() => {
        EssayQuestion.create('\t\t\t');
      }).toThrow('Question text is required');
    });

    it('should throw error if question text is only newlines', () => {
      expect(() => {
        EssayQuestion.create('\n\n\n');
      }).toThrow('Question text is required');
    });

    it('should accept question text with leading/trailing whitespace', () => {
      const question = EssayQuestion.create('  What is polymorphism?  ');

      // Value object stores the text as-is (no trimming)
      expect(question.getQuestionText()).toBe('  What is polymorphism?  ');
    });
  });

  describe('getQuestionText', () => {
    it('should return the question text', () => {
      const question = EssayQuestion.create('Explain inheritance.');

      expect(question.getQuestionText()).toBe('Explain inheritance.');
    });
  });

  describe('toObject', () => {
    it('should convert to plain object with type ESSAY', () => {
      const question = EssayQuestion.create('Explain polymorphism.');

      const obj = question.toObject();

      expect(obj).toEqual({
        type: 'ESSAY',
        questionText: 'Explain polymorphism.',
      });
    });

    it('should return new object on each call', () => {
      const question = EssayQuestion.create('Explain polymorphism.');

      const obj1 = question.toObject();
      const obj2 = question.toObject();

      // Should be equal but not same reference
      expect(obj1).toEqual(obj2);
      expect(obj1).not.toBe(obj2);
    });
  });

  describe('equals', () => {
    it('should return true for identical questions', () => {
      const question1 = EssayQuestion.create('Explain polymorphism.');
      const question2 = EssayQuestion.create('Explain polymorphism.');

      expect(question1.equals(question2)).toBe(true);
    });

    it('should return false for different question text', () => {
      const question1 = EssayQuestion.create('Explain polymorphism.');
      const question2 = EssayQuestion.create('Explain inheritance.');

      expect(question1.equals(question2)).toBe(false);
    });

    it('should return false for case-sensitive differences', () => {
      const question1 = EssayQuestion.create('Explain polymorphism.');
      const question2 = EssayQuestion.create('Explain Polymorphism.');

      expect(question1.equals(question2)).toBe(false);
    });

    it('should return false for whitespace differences', () => {
      const question1 = EssayQuestion.create('Explain polymorphism.');
      const question2 = EssayQuestion.create('Explain  polymorphism.');

      expect(question1.equals(question2)).toBe(false);
    });

    it('should return false when comparing with non-EssayQuestion', () => {
      const question = EssayQuestion.create('Explain polymorphism.');
      const notAQuestion = { questionText: 'Explain polymorphism.' };

      expect(question.equals(notAQuestion as any)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should maintain immutability through toObject', () => {
      const question = EssayQuestion.create('Explain polymorphism.');

      const obj = question.toObject();
      obj.questionText = 'Modified text';

      // Original question should be unchanged
      expect(question.getQuestionText()).toBe('Explain polymorphism.');
    });

    it('should create independent instances', () => {
      const question1 = EssayQuestion.create('Explain polymorphism.');
      const question2 = EssayQuestion.create('Explain inheritance.');

      // Each instance should be independent
      expect(question1.getQuestionText()).toBe('Explain polymorphism.');
      expect(question2.getQuestionText()).toBe('Explain inheritance.');
    });
  });
});
