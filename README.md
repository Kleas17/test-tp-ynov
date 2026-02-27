# Test TP1 Ynov

Application React de formulaire utilisateur avec validations métier, tests automatisés et déploiement continu sur GitHub Pages.

## URL de production

- https://kleas17.github.io/test-tp-ynov/

## Package npm

- https://www.npmjs.com/package/test-tp1-ynov-react-kleas17?activeTab=readme

## Fonctionnalités

- Validation client complète (identité, email, date de naissance, code postal)
- Chargement/sauvegarde via API (`axios`) au lieu de `localStorage`
- Gestion des erreurs backend :
  - `400` : message métier backend affiché
  - `500` : message de résilience affiché sans crash
- Navigation SPA multi-pages (`/` et `/register`) avec état partagé

## Stack

- React 18 (`react-scripts` 5)
- Jest + Testing Library
- Cypress
- Axios
- GitHub Actions + GitHub Pages
- Codecov

## Structure

- `my-app/`: application React principale
- `validator.js`, `module.js`, `__tests__/`: exercices et tests Node à la racine
- `.github/workflows/build_test_deploy_react.yml`: pipeline CI/CD

## Commandes utiles

Depuis la racine:

- `npm test` : lance les tests racine (hors `my-app`)
- `npm run docs` : génère la documentation JSDoc racine (`docs/`)

Depuis `my-app/`:

- `npm install`
- `npm start`
- `npm test`
- `npm run cypress:run`
- `npm run build`

## E2E et Mock réseau

- Les tests E2E utilisent `cy.intercept` pour bouchonner `GET/POST /users`
- Les tests Jest mockent `axios` via `jest.mock('axios')`
- Les scénarios succès, `400` et `500` sont couverts

## CI/CD

Le workflow GitHub Actions exécute:

1. installation des dépendances
2. tests Jest + couverture
3. tests E2E Cypress headless
4. upload couverture Codecov
5. build React + publication GitHub Pages

Variables injectées au build et au run Cypress:

- `REACT_APP_API_URL=https://jsonplaceholder.typicode.com`
- `REACT_APP_API_TOKEN=${{ secrets.JSONPLACEHOLDER_TOKEN }}`

## Livraison activité 5

Tag de fin d'étape:

```bash
git tag activite_5
git push --tags
```
