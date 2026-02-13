import {
  ValidationError,
  validateAge,
  validateEmail,
  validateIdentity,
  validatePostalCode,
} from './validator';

describe('ValidationError', () => {
  test('expose le code et le message', () => {
    const error = new ValidationError('TEST_CODE', 'Message test');
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Message test');
  });
});

describe('validateAge', () => {
  test('retourne un age numerique pour un adulte', () => {
    const age = validateAge(new Date('1990-01-01'));
    expect(typeof age).toBe('number');
    expect(age).toBeGreaterThanOrEqual(18);
  });

  test('rejette un type invalide', () => {
    expect(() => validateAge('1990-01-01')).toThrow('Date de naissance invalide');
  });

  test('rejette une date invalide', () => {
    expect(() => validateAge(new Date('invalid-date'))).toThrow('Date de naissance invalide');
  });

  test('rejette un utilisateur mineur', () => {
    expect(() => validateAge(new Date('2015-06-01'))).toThrow(
      "L'utilisateur doit avoir au moins 18 ans"
    );
  });
});

describe('validatePostalCode', () => {
  test('accepte un code postal francais valide', () => {
    expect(() => validatePostalCode('75015')).not.toThrow();
  });

  test('rejette un type non string', () => {
    expect(() => validatePostalCode(75015)).toThrow(
      'Le code postal doit etre une chaine de caracteres'
    );
  });

  test('rejette un code avec lettres', () => {
    expect(() => validatePostalCode('75A15')).toThrow('Code postal francais invalide');
  });

  test('rejette un code trop court', () => {
    expect(() => validatePostalCode('1234')).toThrow('Code postal francais invalide');
  });

  test('rejette un code trop long', () => {
    expect(() => validatePostalCode('123456')).toThrow('Code postal francais invalide');
  });
});

describe('validateIdentity', () => {
  test('accepte nom simple', () => {
    expect(() => validateIdentity('Jean Dupont')).not.toThrow();
  });

  test('accepte accents et tirets', () => {
    expect(() => validateIdentity('Élodie-Anne')).not.toThrow();
  });

  test('rejette type non string', () => {
    expect(() => validateIdentity(null)).toThrow(
      'Le nom ou le prenom doit etre une chaine de caracteres'
    );
  });

  test('rejette contenu HTML', () => {
    expect(() => validateIdentity('<b>Jean</b>')).toThrow('Contenu HTML detecte');
  });

  test('rejette chiffres et symboles', () => {
    expect(() => validateIdentity('Jean123')).toThrow('Caracteres invalides dans le nom');
    expect(() => validateIdentity('Jean!')).toThrow('Caracteres invalides dans le nom');
  });

  test('rejette chaine vide', () => {
    expect(() => validateIdentity('')).toThrow('Caracteres invalides dans le nom');
  });
});

describe('validateEmail', () => {
  test('accepte email valide', () => {
    expect(() => validateEmail('jean.dupont@example.com')).not.toThrow();
  });

  test('rejette type non string', () => {
    expect(() => validateEmail(undefined)).toThrow("L'email doit etre une chaine de caracteres");
  });

  test('rejette format invalide', () => {
    expect(() => validateEmail('jean.dupont')).toThrow("Format d'email invalide");
  });

  test('rejette email avec espace', () => {
    expect(() => validateEmail('jean dupont@example.com')).toThrow("Format d'email invalide");
  });
});
