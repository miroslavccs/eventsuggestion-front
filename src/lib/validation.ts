export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function validateAccount(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (password.length < 8) errors.password = 'Use at least 8 characters';
  return errors;
}

export function validateAbout(firstName: string, lastName: string, age: number | null | 'invalid'): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!firstName.trim()) errors.firstName = 'Required';
  if (!lastName.trim()) errors.lastName = 'Required';
  if (age === 'invalid') errors.birth = 'Use DD.MM.YYYY';
  else if (age != null && (age < 13 || age > 120)) errors.birth = 'You must be at least 13';
  return errors;
}
