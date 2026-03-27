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

## E2E et appels reels

- Les specs `my-app/cypress/e2e/live-*.cy.js` tournent contre la stack Docker reelle
- Aucun mock reseau n'est utilise dans cette suite live
- L'API expose des routes de preparation E2E uniquement si `ENABLE_E2E_TEST_ROUTES=true`
- Les tests Jest continuent a mocker `axios` pour les tests unitaires front

## CI/CD

Le workflow GitHub Actions exécute:

1. installation des dépendances
2. tests Jest + couverture
3. tests E2E Cypress headless
4. upload couverture Codecov
5. build React + publication GitHub Pages
6. demarrage de la stack Docker Compose complete
7. execution des specs Cypress live sur l'environnement reel
8. push Docker Hub apres succes total des tests E2E si les secrets Docker Hub sont definis

Secrets GitHub utiles :

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_APP_PASSWORD`
- `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN` pour le push d'image
- `CODECOV_TOKEN` et `NPM_TOKEN` uniquement pour les integrations optionnelles correspondantes

## Livraison activité 5

Tag de fin d'étape:

```bash
git tag activite_5
git push --tags
```

## Docker (conforme PDF)

### Fichiers Docker présents

- `Dockerfile` : image MySQL custom basée sur l'image officielle `mysql:8.4`
- `sqlfiles/migration-v001.sql` : création de la base `ynov_ci`
- `sqlfiles/migration-v002.sql` : création de la table `utilisateur`
- `sqlfiles/migration-v003.sql` : insertion de données de démonstration
- `.env.example` : exemple de variables, sans secrets en clair
- `.dockerignore` : réduction du contexte de build
- `docker-compose.yml` : orchestration MySQL + API FastAPI + React + Adminer
- `api/Dockerfile` : image de l'API Python
- `my-app/Dockerfile` : image Node/React pour lancer la webapp
- `api/.dockerignore` et `my-app/.dockerignore` : optimisation des contextes de build

### Preparation

Les secrets ne doivent pas transiter dans un fichier de configuration versionne.

Sous PowerShell, exportez les variables avant de lancer la stack :

```powershell
$env:MYSQL_ROOT_PASSWORD='votre-secret-root'
$env:MYSQL_PASSWORD='votre-secret-app'
$env:MYSQL_DATABASE='ynov_ci'
$env:MYSQL_USER='app_user'
$env:MYSQL_PORT='3306'
$env:API_PORT='8000'
$env:ADMINER_PORT='8080'
$env:REACT_PORT='3000'
$env:REACT_APP_API_URL='http://localhost:8000'
$env:ENABLE_E2E_TEST_ROUTES='false'
```

Le fichier `.env.example` sert uniquement d'aide-memoire pour les noms de variables attendues.

### Build de l'image

```bash
docker build -t migration_mysql .
```

Le `Dockerfile` MySQL reste volontairement minimal.
Les scripts SQL sont embarqués dans l'image via `/docker-entrypoint-initdb.d`, ce qui permet de faire fonctionner aussi bien `docker run` que `docker compose up`.

### Lancer le conteneur (mode docker run, comme dans le PDF)

```bash
docker run -d -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" -e MYSQL_DATABASE="$MYSQL_DATABASE" -e MYSQL_USER="$MYSQL_USER" -e MYSQL_PASSWORD="$MYSQL_PASSWORD" --name migration_container -p 3306:3306 migration_mysql
```

### Lancer la stack (mode compose)

```bash
docker compose up -d --build
```

Cela démarre :

- MySQL sur `localhost:3306`
- l'API FastAPI sur `http://localhost:8000`
- le front React sur `http://localhost:3000`
- Adminer sur `http://localhost:8080`

Les services communiquent via un réseau Docker `bridge` explicite nommé `app_network`.
La base MySQL persiste dans le volume `mysql_data`.
Le service React est construit depuis `my-app/Dockerfile`, monte uniquement les fichiers utiles (`src/`, `public/`, `package*.json`) et démarre via `npm start`.
L'image MySQL est rebuildée depuis le `Dockerfile` racine avec les migrations SQL intégrées.

Important : les scripts SQL d'initialisation ne sont rejoués que si le volume MySQL est vide.
Pour réinitialiser complètement la base après un changement de migration :

```bash
docker compose down -v
docker compose up -d --build
```

### Vérification de l'API

```bash
curl http://localhost:8000/health
curl http://localhost:8000/users
curl http://localhost:3000
```

### Vérification dans Adminer

Ouvrir `http://localhost:8080`, puis se connecter avec :

- Système : `MySQL`
- Serveur : `mysql`
- Utilisateur : `root` ou `ynov_app`
- Mot de passe : valeur exportee dans votre shell
- Base : `ynov_ci`

Le front Dockerisé est déjà configuré pour appeler l'API locale sur `http://localhost:8000`.

### Vérification dans MySQL

```bash
docker exec -it migration_container bash
mysql -u root -p
show databases;
use ynov_ci;
show tables;
```

La base `ynov_ci` et la table `utilisateur` doivent être présentes.
L'endpoint `GET /users` doit également renvoyer les utilisateurs insérés par `migration-v003.sql`.
La page `http://localhost:3000` doit afficher un compteur strictement supérieur à `0 utilisateur(s) inscrit(s)`.

### Arrêt / suppression

```bash
docker container stop migration_container
docker container rm migration_container
docker image rm migration_mysql
```

Pour la stack compose :

```bash
docker compose down -v
```
