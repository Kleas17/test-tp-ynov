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
  INVALID_POSTAL_TYPE: 'Le code postal doit etre une chaine de caracteres',
  INVALID_POSTAL_CODE: 'Code postal francais invalide',
  INVALID_IDENTITY_TYPE: "Le nom ou le prenom doit etre une chaine de caracteres",
  XSS_DETECTED: 'Contenu HTML detecte',
  INVALID_NAME: 'Caracteres invalides dans le nom',
  INVALID_EMAIL_TYPE: "L'email doit etre une chaine de caracteres",
  INVALID_EMAIL: "Format d'email invalide",
};

/**
 * Computes age in full years from a birth date.
 * @param {Date} birthDate Birth date to evaluate.
 * @returns {number} Age in years.
 */
function calculateAge(birthDate) {
  const dateDiff = new Date(Date.now() - birthDate.getTime());
  return Math.abs(dateDiff.getUTCFullYear() - 1970);
}

/**
 * Validates legal age (18+).
 * @param {Date} birthDate Birth date to validate.
 * @returns {number} Computed age when valid.
 * @throws {ValidationError} When date is invalid or user is underage.
 */
function validateAge(birthDate) {
  if (!(birthDate instanceof Date) || Number.isNaN(birthDate.getTime())) {
    throw new ValidationError('INVALID_DATE', ERROR_MESSAGES.INVALID_DATE);
  }

  const age = calculateAge(birthDate);
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
 * Validates email format.
 * @param {string} email Email address to validate.
 * @throws {ValidationError} When input is invalid.
 */
function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new ValidationError('INVALID_TYPE', ERROR_MESSAGES.INVALID_EMAIL_TYPE);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('INVALID_EMAIL', ERROR_MESSAGES.INVALID_EMAIL);
  }
}

export {
  ValidationError,
  validateAge,
  validatePostalCode,
  validateIdentity,
  validateEmail,
};
