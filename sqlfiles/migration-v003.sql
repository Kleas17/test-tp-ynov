USE ynov_ci;

INSERT INTO utilisateur (nom, prenom, email, date_naissance, code_postal, ville)
SELECT "Dupont", "Alice", "alice.dupont@ynov.local", "1998-04-12", "75001", "Paris"
WHERE NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE email = "alice.dupont@ynov.local"
);

INSERT INTO utilisateur (nom, prenom, email, date_naissance, code_postal, ville)
SELECT "Martin", "Leo", "leo.martin@ynov.local", "1996-09-30", "69002", "Lyon"
WHERE NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE email = "leo.martin@ynov.local"
);
