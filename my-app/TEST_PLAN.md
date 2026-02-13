# TEST PLAN - Activite 2

## Objectif
Valider l'integration de la logique metier (`validator`) dans l'UI React et garantir le feedback utilisateur.

## Portee
- Composant teste: `src/App.js`
- Type de tests: integration React Testing Library (DOM + interactions utilisateur)

## Strategie
- Les UT (activite 1) couvrent la logique pure:
  - `validateIdentity`
  - `validateEmail`
  - `validatePostalCode`
  - `validateAge`
- Les IT (activite 2) couvrent le branchement UI <-> metier:
  - affichage des erreurs dans le DOM
  - bouton de soumission desactive tant que le formulaire est invalide
  - transitions invalide -> valide apres corrections
  - sauvegarde des donnees via `localStorage.setItem`
  - feedback succes (toaster)
  - reset du formulaire apres soumission valide

## Scenarios IT couverts
1. Utilisateur chaotique:
   - saisie invalide (`<b>`, email invalide, CP invalide)
   - verification des messages d'erreur visibles
   - correction progressive
   - verification activation du bouton quand tout est valide
2. Soumission valide:
   - spy sur `localStorage.setItem`
   - verification de la cle et de la charge JSON
   - verification du toaster
   - verification que tous les champs sont vides apres submit
3. Cas metier mineur:
   - date de naissance < 18 ans
   - message d'erreur visible
   - bouton reste desactive

## Risques residuels
- Pas de test E2E navigateur reel (uniquement environnement jsdom).
- Pas de test de persistence multi-enregistrements (une sauvegarde simple est testee).
