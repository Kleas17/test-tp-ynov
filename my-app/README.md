# Application d'inscription SPA

## Fonctionnalites

- Navigation SPA avec `react-router-dom`
  - `/` : Accueil, compteur des inscrits, liste des inscrits (Nom + Prénom)
  - `/register` : Formulaire d'inscription
- Etat partage au niveau racine (tableau des utilisateurs)
- Persistance via `localStorage` (`registrations`)
- Validation metier avec messages d'erreur (dont email deja utilise)

## Pyramide de tests

- UT : logique pure dans `src/validator.js`
- IT : interactions UI + rendu + navigation dans `src/App.test.js`
- E2E : parcours multi-vues dans `cypress/e2e/navigation.cy.js`

## Commandes

Dans `my-app` :

```bash
npm install
npm start
```

Application disponible sur `http://localhost:3000`.

Tests unitaires et integration :

```bash
npm test
```

Tests Cypress interactifs :

```bash
npm run cypress:open:chrome
```

Tests Cypress headless (CI/local) :

```bash
npm run cypress:run
```

## CI/CD

Le pipeline GitHub Actions execute :

1. `npm test`
2. Cypress en headless via `cypress-io/github-action@v6`
3. build de l'application
