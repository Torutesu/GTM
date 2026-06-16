import { PolicyChecker } from '../policy-checker';

describe('PolicyChecker', () => {
  let checker: PolicyChecker;

  beforeEach(() => {
    checker = new PolicyChecker();
  });

  describe('check', () => {
    it('passes safe content', () => {
      const result = checker.check('Check out our new marketing tools!');
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('blocks hard violations', () => {
      const result = checker.check('Buy credit card numbers online');
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('block');
      expect(result.violations.some((v) => v.type === 'hard')).toBe(true);
    });

    it('warns on soft violations', () => {
      const result = checker.check('This election season is important');
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('warn');
    });

    it('detects child safety violations', () => {
      const result = checker.check('Watch child porn videos');
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('detects violence-related content', () => {
      const result = checker.check('How to make a bomb tutorial');
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('detects drug references', () => {
      const result = checker.check('Buy cocaine online');
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('handles empty text', () => {
      const result = checker.check('');
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('pass');
    });

    it('handles mixed content with hard block priority', () => {
      const result = checker.check('Great marketing tips! Also buy heroin');
      expect(result.severity).toBe('block');
      expect(result.passed).toBe(false);
    });

    it('handles Japanese prohibited keywords', () => {
      const result = checker.check('覚醒剤');
      expect(result.severity).toBe('block');
    });

    it('passes marketing-related content', () => {
      const results = [
        checker.check('10 tips for better engagement'),
        checker.check('Our new product launch'),
        checker.check('Follow us for more content'),
        checker.check('Brand identity guide 2024'),
      ];
      results.forEach((r) => expect(r.passed).toBe(true));
    });

    it('detects self-harm content', () => {
      const result = checker.check('self-harm prevention');
      expect(result.severity).toBe('block');
    });
  });
});
