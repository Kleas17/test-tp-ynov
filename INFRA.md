# Infrastructure - Documentation Technique

## Architecture deployée

### Instance 1 - Registre Docker privé

- **Service** : Docker Registry
- **Région** : us-east-1
- **Type** : t3.micro (1 vCPU, 1 GB RAM)
- **OS** : Ubuntu 24.04 LTS
- **Stockage** : 8 GB gp3

**Services :**
- Docker Registry v2 (port 5000)
- Nginx (reverse proxy HTTPS - port 443)
- Registry UI (port 80)

**Sécurité :**
- SSL/TLS (self-signed)
- Authentification htpasswd
- Ports ouverts : 22, 443

### Instance 2 - Application

- **Service** : Application Web
- **Région** : us-east-1
- **Type** : t3.micro (1 vCPU, 1 GB RAM)
- **OS** : Ubuntu 24.04 LTS
- **Stockage** : 20 GB gp3 + 2 GB swap

**Services :**
- React (port 3000)
- FastAPI (port 8000)
- MySQL 8.4 (port 3306)
- Adminer (port 8080)

**Sécurité :**
- Ports ouverts : 22, 3000, 8000, 8080
- Clé SSH générée via Terraform
- Aucun accès manuel

### Communication

- L'application récupère les images via :
    - `docker pull` en HTTPS (port 443)
    - depuis le registre privé

## Pipeline Zero Touch (deploy.yml)

### Déclenchement

Workflow manuel à éxécuter via GitHub Actions > `Zero Touch Deploy` > Run workflow.

### Etapes Pipeline

| Etape              | Duree      | Description                                                       |
|--------------------|------------|-------------------------------------------------------------------|
| Configure Docker   | ~3s        | Autorise le registre privé (insecure registry)                    |
| Login registry     | ~1s        | Authentification au registre Docker privé                         |
| Build & Push MySQL | ~19s       | Build `Dockerfile` (racine) + push vers registre privé            |
| Build & Push API   | ~19s       | Build `api/Dockerfile` + push vers registre privé                 |
| Build & Push React | ~1m20s     | Build `my-app/Dockerfile` + push (image lourde: Cypress inclus)   |
| Setup Terraform    | ~1s        | Installation de Terraform                                         |
| Terraform Init     | ~5s        | Initialise les providers (AWS, TLS, Random)                       |
| Terraform Apply    | ~21s       | Crée EC2 + key pair + security group (noms uniques via random_id) |
| Extract outputs    | ~1s        | Récupère IP publique + clé SSH privee                             |
| Generate inventory | ~0s        | Crée `inventory.ini` dynamique pour Ansible                       |
| Wait for SSH       | ~27s       | Boucle jusqu'à ce que le serveur accepte les connexions SSH       |
| Install Ansible    | ~42s       | Installation d’Ansible sur le runner                              |
| Ansible playbook   | ~2m34s     | Configure le serveur et déploie la stack                          |
| Validate API       | ~0s        | Curl sur `/health` (jusqu’à 30 retries, arrêt sur HTTP 200)       |
| Validate React     | ~18s       | Curl sur `:3000` (jusqu’à 30 retries, arrêt sur HTTP 200)         |
| Deployment summary | ~0s        | Affichage des URLs finales                                        |
| **Total**          | **~6m38s** | **Pipeline complète**                                             |

### Playbook Ansible

1. Mise à jour apt + installation Docker et docker-compose-v2
2. Ajout de l'utilisateur `ubuntu` au groupe `docker`
3. Configuration du daemon Docker pour accepter le registre privé (SSL self-signed -> `insecure-registries`)
4. `docker login` au registre privé (credentials via `--extra-vars`, `no_log: true`)
5. Création de 2GB de swap (nécessaire pour t3.micro car sinon erreur lors du workflow)
6. Création du repertoire `/home/ubuntu/app-stack/`
7. Upload du `docker-compose.yml` de production (template Jinja2)
8. Ecriture du fichier `.env` avec les secrets (mots de passe MySQL, URL API)
9. `docker compose pull` des 3 images depuis le registre privé
10. Démarrage de MySQL en premier, attente du healthcheck
11. Démarrage des services restants (API, React, Adminer)
12. Vérification du healthcheck API

## Terraform - Infrastructure applicative

### Ressources créees

| Ressource                   | Nom               | Description                                                                          |
|-----------------------------|-------------------|--------------------------------------------------------------------------------------|
| `random_id.suffix`          | -                 | Suffixe aléatoire pour eviter les conflits de noms (erreur rencontrée lors d'un run) |
| `tls_private_key.app_key`   | -                 | Clé SSH RSA 4096 bits générée a la volée                                             |
| `aws_key_pair.app_key`      | `app-key-<hex>`   | Key pair AWS (nom unique par déploiement)                                            |
| `aws_security_group.app_sg` | `app-sg-<hex>`    | Security group (nom unique par déploiement)                                          |
| `aws_instance.app`          | `ynov-app-server` | Instance EC2 t3.micro                                                                |

### Ports ouverts (Security Group)

| Port | Protocole | Usage                    |
|------|-----------|--------------------------|
| 22   | TCP       | SSH (Ansible uniquement) |
| 3000 | TCP       | Frontend React           |
| 8000 | TCP       | API FastAPI              |
| 8080 | TCP       | Adminer                  |

### Outputs

| Output        | Sensible | Usage                                                   |
|---------------|----------|---------------------------------------------------------|
| `public_ip`   | Non      | IP publique de l'instance, passée a Ansible             |
| `private_key` | Oui      | Clé SSH privée, écrite dans `app-key.pem` sur le runner |

### Etat Terraform

Le `tfstate` est éphèmère (local au runner GitHub Actions). Chaque déploiement crée une nouvelle infrastructure indépendante donc les anciens serveurs doivent etre supprimes manuellement.

## Contraintes techniques et solutions

Lors de nos nombreux run du workflow, nous avons rencontrés plusieurs problèmes distincts. Dont la plupart avec Ansible.

### RAM limitée (t3.micro = 1GB)

**Problème** : MySQL + FastAPI + React (webpack dev server) + Adminer consomment plus d'1GB. Le serveur bug et la connexion SSH tombe.

**Solution** : Création d'un fichier swap de 2GB au début du playbook Ansible (`fallocate + mkswap + swapon`).

### Disque limité (defaut 8GB)

**Problème** : Les images Docker (surtout React avec Cypress ~1GB) remplissent le disque par defaut de 8GB.

**Solution** : Volume root EBS agrandi a 20GB (gp3) dans la configuration Terraform.

### SSL auto-signe sur le registre

**Problème** : Docker refuse de pull/push vers un registre avec un certificat auto-signé.

**Solution** : Configuration `insecure-registries` dans `/etc/docker/daemon.json` sur le runner CI et sur le serveur applicatif.

### Noms de ressources AWS en conflit

**Probleme** : Le tfstate est éphèmère, donc Terraform ne sait pas que les ressources existent deja. La recréation echoue avec `Duplicate`.

**Solution** : Utilisation de `random_id` pour générer des noms uniques a chaque déploiement (ex: `app-key-a3f7b2c1`).

### MySQL lent au demarrage

**Problème** : Sur t3.micro, MySQL met 30-60s pour s'initialiser (creation de base + migrations SQL). Les services dependants échouent si ils demarrent trop tôt.

**Solution** : Démarrage de MySQL seul en premier, attente du healthcheck (`docker inspect`), puis démarrage des autres services.

## GitHub Secrets requis

| Secret                  | Description                               |
|-------------------------|-------------------------------------------|
| `AWS_ACCESS_KEY_ID`     | Clé d'acces IAM AWS                       |
| `AWS_SECRET_ACCESS_KEY` | Clé secrete IAM AWS                       |
| `AWS_REGISTRY_IP`       | IP du registre Docker priveé              |
| `REGISTRY_PASSWORD`     | Mot de passe du registre (htpasswd)       |
| `MYSQL_ROOT_PASSWORD`   | Mot de passe root MySQL                   |
| `MYSQL_APP_PASSWORD`    | Mot de passe utilisateur applicatif MySQL |
