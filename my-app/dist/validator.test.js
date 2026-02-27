import { ValidationError, validateAge, validateEmail, validateIdentity, validatePostalCode, validateUniqueEmail } from './validator';
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
    expect(() => validateAge(new Date('2015-06-01'))).toThrow("L'utilisateur doit avoir au moins 18 ans");
  });
  test('rejette une date dans le futur', () => {
    expect(() => validateAge(new Date('2999-01-01'))).toThrow('Date de naissance invalide');
  });
  test('rejette une date trop ancienne (age farfelu)', () => {
    expect(() => validateAge(new Date('0008-08-08'))).toThrow('Date de naissance invalide');
  });
});
describe('validatePostalCode', () => {
  test('accepte un code postal francais valide', () => {
    expect(() => validatePostalCode('75015')).not.toThrow();
  });
  test('rejette un type non string', () => {
    expect(() => validatePostalCode(75015)).toThrow('Le code postal doit être une chaîne de caractères');
  });
  test('rejette un code avec lettres', () => {
    expect(() => validatePostalCode('75A15')).toThrow('Code postal français invalide');
  });
  test('rejette un code trop court', () => {
    expect(() => validatePostalCode('1234')).toThrow('Code postal français invalide');
  });
  test('rejette un code trop long', () => {
    expect(() => validatePostalCode('123456')).toThrow('Code postal français invalide');
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
    expect(() => validateIdentity(null)).toThrow('Le nom ou le prénom doit être une chaîne de caractères');
  });
  test('rejette contenu HTML', () => {
    expect(() => validateIdentity('<b>Jean</b>')).toThrow('Contenu HTML détecté');
  });
  test('rejette chiffres et symboles', () => {
    expect(() => validateIdentity('Jean123')).toThrow('Caractères invalides dans le nom');
    expect(() => validateIdentity('Jean!')).toThrow('Caractères invalides dans le nom');
  });
  test('rejette chaine vide', () => {
    expect(() => validateIdentity('')).toThrow('Caractères invalides dans le nom');
  });
});
describe('validateEmail', () => {
  test('accepte email valide', () => {
    expect(() => validateEmail('jean.dupont@example.com')).not.toThrow();
  });
  test('rejette type non string', () => {
    expect(() => validateEmail(undefined)).toThrow("L'email doit être une chaîne de caractères");
  });
  test('rejette format invalide', () => {
    expect(() => validateEmail('jean.dupont')).toThrow("Format d'email invalide");
  });
  test('rejette email avec espace', () => {
    expect(() => validateEmail('jean dupont@example.com')).toThrow("Format d'email invalide");
  });
  test('rejette email avec caracteres farfelus (accent, parenthese)', () => {
    expect(() => validateEmail('kleas3.marc@gmaa)l.com')).toThrow("Format d'email invalide");
    expect(() => validateEmail('kleas3.marc@gmaàl.com')).toThrow("Format d'email invalide");
  });
  test('rejette email avec double point', () => {
    expect(() => validateEmail('jean..dupont@example.com')).toThrow("Format d'email invalide");
  });
});
describe('validateUniqueEmail', () => {
  test('accepte un email non present', () => {
    expect(() => validateUniqueEmail('new@example.com', [{
      email: 'jean.dupont@example.com'
    }])).not.toThrow();
  });
  test('rejette un email deja present', () => {
    expect(() => validateUniqueEmail('jean.dupont@example.com', [{
      email: 'jean.dupont@example.com'
    }])).toThrow('Cet email est déjà utilisé');
  });
  test('compare sans tenir compte de la casse', () => {
    expect(() => validateUniqueEmail('JEAN.DUPONT@example.com', [{
      email: 'jean.dupont@example.com'
    }])).toThrow('Cet email est déjà utilisé');
  });
  test('ignore les entrees invalides dans la liste', () => {
    expect(() => validateUniqueEmail('new@example.com', [null, {
      email: 42
    }, {
      notEmail: true
    }])).not.toThrow();
  });
});