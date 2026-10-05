import { isEmail, validateAbout, validateAccount } from '@/lib/validation';

describe('validation', () => {
  it('accepts a valid account', () => {
    expect(validateAccount('a@b.co', 'longenough')).toEqual({});
  });
  it('rejects bad email and short password', () => {
    expect(validateAccount('nope', 'short')).toEqual({ email: expect.any(String), password: expect.any(String) });
    expect(isEmail('a@b')).toBe(false);
  });
  it('requires names and a plausible age', () => {
    expect(validateAbout('A', 'B', null)).toEqual({});
    expect(validateAbout(' ', '', null)).toHaveProperty('firstName');
    expect(validateAbout('A', 'B', 12)).toHaveProperty('birth');
    expect(validateAbout('A', 'B', 'invalid')).toHaveProperty('birth');
  });
});
