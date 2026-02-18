# Test TP1 Ynov

Application React de formulaire utilisateur avec validations metier, tests automatises et deploiement continu sur GitHub Pages.

## URL de production

- https://kleas17.github.io/test-tp-ynov/

## Fonctionnalites

- Validation client complete (identite, email, date de naissance, code postal)
- Sauvegarde locale des donnees (`localStorage`)
- Feedback utilisateur (erreurs champ + message de confirmation)
- Couverture de tests exigeante (seuil global 100% sur l'app React)

## Stack

- React 18 (`react-scripts` 5)
- Jest + Testing Library
- JSDoc
- GitHub Actions + GitHub Pages
- Codecov

## Structure

- `my-app/`: application React principale
- `validator.js`, `module.js`, `__tests__/`: exercices et tests Node a la racine
- `.github/workflows/build_test_deploy_react.yml`: pipeline CI/CD

## Commandes utiles

Depuis la racine:

- `npm test` : lance les tests racine (hors `my-app`)
- `npm run docs` : genere la documentation JSDoc racine (`docs/`)

Depuis `my-app/`:

- `npm install` : installe les dependances
- `npm test` : lance les tests React + couverture (mode CI, sans watch)
- `npm run docs` : genere la JSDoc de l'app dans `my-app/public/docs/`
- `npm run build` : build de production

## CI/CD

Le workflow GitHub Actions execute:

1. installation des dependances
2. tests + couverture
3. upload de couverture vers Codecov
4. generation JSDoc
5. build React avec `PUBLIC_URL` adapte a GitHub Pages
6. publication sur GitHub Pages

## Qualite et documentation

- Les composants et validateurs principaux sont documentes en JSDoc.
- Le README public est expose via `my-app/public/README.md`.
- La JSDoc est generee dans `my-app/public/docs/` pour etre publiee sur GitHub Pages.
