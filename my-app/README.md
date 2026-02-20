# Application d'inscription SPA

## Fonctionnalités

- Navigation SPA avec `react-router-dom`
  - `/` : accueil, compteur des inscrits, liste des inscrits (Nom + Prénom)
  - `/register` : formulaire d'inscription
- État partagé au niveau racine (tableau des utilisateurs)
- Données chargées/sauvegardées via API (`/users`) avec `axios`
- Résilience UI face aux erreurs backend :
  - `400` : affichage du message métier renvoyé par le serveur
  - `500` : affichage d'une alerte utilisateur sans crash de l'application

## Architecture API

- Fichier dédié : `src/api.js`
- API par défaut : `https://jsonplaceholder.typicode.com`
- Variables d'environnement prises en charge :
  - `REACT_APP_API_URL`
  - `REACT_APP_SERVER_PORT`
  - `REACT_APP_API_TOKEN` (header `Authorization: Bearer ...`)

## Pyramide de tests

- UT : logique pure dans `src/validator.js`
- IT : interactions UI + rendu + navigation dans `src/App.test.js`
- IT API : appels réseau mockés dans `src/api.test.js` avec `jest.mock('axios')`
- E2E : parcours multi-vues avec `cy.intercept` dans `cypress/e2e/navigation.cy.js`

## Couverture des cas (activité 5)

- Succès (`200/201`)
- Erreur métier (`400`) avec message backend visible
- Erreur serveur (`500`) avec message utilisateur de résilience
- Aucun appel réseau réel dans Jest (axios entièrement mocké)

## Commandes

Dans `my-app` :

```bash
npm install
npm start
npm test
npm run cypress:run
```

## CI/CD

Le workflow GitHub Actions exécute :

1. tests Jest
2. tests E2E Cypress
3. build React
4. publication GitHub Pages

Le workflow injecte :

- `REACT_APP_API_URL=https://jsonplaceholder.typicode.com`
- `REACT_APP_API_TOKEN=${{ secrets.JSONPLACEHOLDER_TOKEN }}`
