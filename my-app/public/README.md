# Test TP1 Ynov

Application React de formulaire utilisateur avec validations metier, tests automatises, couverture de code et deploiement continu sur GitHub Pages.

## Liens utiles

- Application en ligne: https://kleas17.github.io/test-tp-ynov/
- Documentation JSDoc publiee: https://kleas17.github.io/test-tp-ynov/docs/
- Depot GitHub: https://github.com/Kleas17/test-tp-ynov

## Objectif du projet

Le projet implemente un formulaire d inscription avec des regles metier strictes:

- validation identite (caracteres autorises, protection HTML),
- validation email,
- validation date de naissance (utilisateur majeur),
- validation code postal francais,
- sauvegarde des donnees valides dans `localStorage`,
- retour utilisateur via messages d erreur et confirmation.

## Fonctionnalites

- Formulaire React ergonomique
- Validation en temps reel
- Messages d erreur explicites par champ
- Bouton de soumission active uniquement si le formulaire est valide
- Message de succes apres soumission
- Donnees persistantes via `localStorage`

## Stack technique

- React 18
- React Scripts 5
- Jest
- React Testing Library
- JSDoc
- GitHub Actions
- GitHub Pages
- Codecov

## Organisation du repo

- `my-app/`: application React principale
- `my-app/src/`: composants, logique, tests
- `my-app/public/`: assets publics (ce README est servi depuis ce dossier)
- `.github/workflows/`: pipeline CI/CD
- `__tests__/`, `validator.js`, `module.js`: exercices et tests Node a la racine

## Installation locale

Prerequis:

- Node.js 20+
- npm 10+

Commandes:

```bash
cd my-app
npm install
```

## Execution locale

Lancer l application:

```bash
cd my-app
npm start
```

## Tests et couverture

Lancer les tests React avec couverture:

```bash
cd my-app
npm test
```

Le script applique deja:

- `--coverage`
- `--watchAll=false`

## Documentation JSDoc

Generer la documentation:

```bash
cd my-app
npm run docs
```

Sortie generee dans:

- `my-app/public/docs/`

Cette doc est ensuite publiee sur GitHub Pages.

## Build de production

```bash
cd my-app
npm run build
```

## CI/CD

Le workflow GitHub Actions:

1. installe les dependances
2. execute les tests et la couverture
3. envoie la couverture vers Codecov
4. genere la JSDoc
5. build l application
6. deploie sur GitHub Pages si tout est vert

Le deploy est conditionne au succes du job de build/test.

## Qualite et standards

- Validation metier centralisee
- Commentaires JSDoc sur les fonctions critiques
- Seuil de couverture global strict dans la configuration Jest
- CI obligatoire avant publication

## Contact

Projet realise dans le cadre du cours Ynov (tests unitaires, CI/CD et documentation).
