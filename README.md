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
6. démarrage de la stack Docker Compose complète
7. smoke test Cypress sur la stack live + push de l'image API

Variables injectées au build et au run Cypress:

- `REACT_APP_API_URL=https://jsonplaceholder.typicode.com`
- `REACT_APP_API_TOKEN=${{ secrets.JSONPLACEHOLDER_TOKEN }}`

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
- `.env.example` : variables d'environnement injectées au run
- `.dockerignore` : réduction du contexte de build
- `docker-compose.yml` : orchestration MySQL + API FastAPI + React + Adminer
- `api/Dockerfile` : image de l'API Python
- `my-app/Dockerfile` : image Node/React pour lancer la webapp
- `api/.dockerignore` et `my-app/.dockerignore` : optimisation des contextes de build

### Préparation

1. Copier le fichier d'exemple :

```bash
cp .env.example .env
```

Sur Windows PowerShell :

```powershell
Copy-Item .env.example .env
```

2. Vérifier les variables dans `.env`.

Exemple :

```env
MYSQL_ROOT_PASSWORD=ynovpwd
MYSQL_DATABASE=ynov_ci
MYSQL_USER=ynov_app
MYSQL_PASSWORD=ynov_app_pwd
MYSQL_PORT=3306
API_PORT=8000
ADMINER_PORT=8080
REACT_PORT=3000
```

### Build de l'image

```bash
docker build -t migration_mysql .
```

Le `Dockerfile` MySQL reste volontairement minimal.
Les scripts SQL sont embarqués dans l'image via `/docker-entrypoint-initdb.d`, ce qui permet de faire fonctionner aussi bien `docker run` que `docker compose up`.

### Lancer le conteneur (mode docker run, comme dans le PDF)

```bash
docker run -d --env-file .env --name migration_container -p 3306:3306 migration_mysql
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
- Mot de passe : valeur définie dans `.env`
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
