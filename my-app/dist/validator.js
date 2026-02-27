/**
 * Validation error used by all business validators.
 */
class ValidationError extends Error {
  /**
   * @param {string} code Stable machine-readable error code.
   * @param {string} message Human-readable error message.
   */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const ERROR_MESSAGES = {
  INVALID_DATE: 'Date de naissance invalide',
  UNDERAGE: "L'utilisateur doit avoir au moins 18 ans",
  INVALID_POSTAL_TYPE: 'Le code postal doit être une chaîne de caractères',
  INVALID_POSTAL_CODE: 'Code postal français invalide',
  INVALID_IDENTITY_TYPE: "Le nom ou le prénom doit être une chaîne de caractères",
  XSS_DETECTED: 'Contenu HTML détecté',
  INVALID_NAME: 'Caractères invalides dans le nom',
  INVALID_EMAIL_TYPE: "L'email doit être une chaîne de caractères",
  INVALID_EMAIL: "Format d'email invalide",
  DUPLICATE_EMAIL: 'Cet email est déjà utilisé'
};

/**
 * Computes age in full years from a birth date.
 * @param {Date} birthDate Birth date to evaluate.
 * @returns {number} Age in years.
 */
function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const hasBirthdayPassed = monthDiff > 0 || monthDiff === 0 && today.getDate() >= birthDate.getDate();
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age;
}

/**
 * Validates legal age (18+) and date realism.
 * @param {Date} birthDate Birth date to validate.
 * @returns {number} Computed age when valid.
 * @throws {ValidationError} When date is invalid, unrealistic, or user is underage.
 */
function validateAge(birthDate) {
  if (!(birthDate instanceof Date) || Number.isNaN(birthDate.getTime())) {
    throw new ValidationError('INVALID_DATE', ERROR_MESSAGES.INVALID_DATE);
  }
  const now = new Date();
  if (birthDate > now) {
    throw new ValidationError('INVALID_DATE', ERROR_MESSAGES.INVALID_DATE);
  }
  const age = calculateAge(birthDate);
  if (age > 120) {
    throw new ValidationError('INVALID_DATE', ERROR_MESSAGES.INVALID_DATE);
  }
  if (age < 18) {
    throw new ValidationError('UNDERAGE', ERROR_MESSAGES.UNDERAGE);
  }
  return age;
}

/**
 * Validates French postal code format.
 * @param {string} code Postal code to validate.
 * @throws {ValidationError} When input is not a string or not 5 digits.
 */
function validatePostalCode(code) {
  if (typeof code !== 'string') {
    throw new ValidationError('INVALID_TYPE', ERROR_MESSAGES.INVALID_POSTAL_TYPE);
  }
  if (!/^\d{5}$/.test(code)) {
    throw new ValidationError('INVALID_POSTAL_CODE', ERROR_MESSAGES.INVALID_POSTAL_CODE);
  }
}

/**
 * Validates identity-like fields (name, surname, city).
 * @param {string} value Value to validate.
 * @throws {ValidationError} When input is invalid or contains HTML.
 */
function validateIdentity(value) {
  if (typeof value !== 'string') {
    throw new ValidationError('INVALID_TYPE', ERROR_MESSAGES.INVALID_IDENTITY_TYPE);
  }
  if (/<[^>]*>/.test(value)) {
    throw new ValidationError('XSS_DETECTED', ERROR_MESSAGES.XSS_DETECTED);
  }
  const nameRegex = /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\- ]+$/;
  if (!nameRegex.test(value)) {
    throw new ValidationError('INVALID_NAME', ERROR_MESSAGES.INVALID_NAME);
  }
}

/**
 * Validates email format with strict ASCII rules.
 * @param {string} email Email address to validate.
 * @throws {ValidationError} When input is invalid.
 */
function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new ValidationError('INVALID_TYPE', ERROR_MESSAGES.INVALID_EMAIL_TYPE);
  }
  const emailRegex = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
  if (!emailRegex.test(email) || email.includes('..')) {
    throw new ValidationError('INVALID_EMAIL', ERROR_MESSAGES.INVALID_EMAIL);
  }
}

/**
 * Ensures an email does not already exist in the user collection.
 * @param {string} email Email to check.
 * @param {Array<{email:string}>} users Registered users.
 * @throws {ValidationError} When email is already registered.
 */
function validateUniqueEmail(email, users) {
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.some(user => {
    if (!user || typeof user.email !== 'string') {
      return false;
    }
    return user.email.trim().toLowerCase() === normalizedEmail;
  });
  if (found) {
    throw new ValidationError('DUPLICATE_EMAIL', ERROR_MESSAGES.DUPLICATE_EMAIL);
  }
}
export { ValidationError, validateAge, validatePostalCode, validateIdentity, validateEmail, validateUniqueEmail };