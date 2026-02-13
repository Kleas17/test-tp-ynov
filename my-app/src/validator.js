class ValidationError extends Error {
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

function calculateAge(birthDate) {
  const dateDiff = new Date(Date.now() - birthDate.getTime());
  return Math.abs(dateDiff.getUTCFullYear() - 1970);
}

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

function validatePostalCode(code) {
  if (typeof code !== 'string') {
    throw new ValidationError('INVALID_TYPE', ERROR_MESSAGES.INVALID_POSTAL_TYPE);
  }
  if (!/^\d{5}$/.test(code)) {
    throw new ValidationError('INVALID_POSTAL_CODE', ERROR_MESSAGES.INVALID_POSTAL_CODE);
  }
}

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
