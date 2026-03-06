USE ynov_ci;

INSERT INTO utilisateur (nom, prenom, email)
SELECT "Dupont", "Alice", "alice.dupont@ynov.local"
WHERE NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE email = "alice.dupont@ynov.local"
);

INSERT INTO utilisateur (nom, prenom, email)
SELECT "Martin", "Leo", "leo.martin@ynov.local"
WHERE NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE email = "leo.martin@ynov.local"
);

