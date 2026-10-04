# Vite & Gourmand — Front-end

Site web du traiteur **Vite & Gourmand** (Bordeaux) : vitrine des menus, commande en ligne et espaces de gestion pour les clients, les employés et l'administrateur.

Ce dépôt contient uniquement le **front-end**. Il communique avec l'API REST Symfony du dépôt `vite-et-gourmand-back` (requêtes HTTP au format JSON, authentification par jeton JWT).

- Front en production : https://vite-et-gourmand-c36478b4c1b0.herokuapp.com
- API en production : https://vite-et-gourmand-api-2b0eeb54e8d5.herokuapp.com

---

## 0. Le routeur (application monopage)

**But :** éviter de dupliquer le header et le footer sur chaque page, centraliser le chargement des pages et gérer les droits de chaque rôle.

Utilisation d'un système de routage due au limite du HTML dans le but de ne pas dupliquer 
les page header, footer.
ainsi que centraliser les données au meme endroits
Le routage utilise une table de correspondance qui associe des URL perméttant de mieux gérer les droits des différents role (invitée,client,employée,admin).

Il est composé de 3 fichiers :

- **`Route.js`** définit la classe `Route`. Chaque route a une URL  qui représente une route de l'application, un titre, le chemin de sa page HTML, la liste des rôles autorisés et le chemin de son script JavaScript.
- **`allRoutes.js`** crée le tableau `allRoutes`, qui contient les 32 routes de l'application, et la variable `websiteName` (le nom du site).
- **`Router.js`** contient la logique de navigation :
  1. il intercepte les clics sur les liens internes ;
  2. il vérifie le rôle de l'utilisateur (une page réservée redirige vers la connexion) ;
  3. il charge la page HTML dans la zone `#main-page` ;
  4. il exécute le script JavaScript de la page.

Ctrl + clic et clic molette ouvrent bien un nouvel onglet, comme sur un site classique.
Pour afficher les logs de navigation dans la console, passer `const debug = true;` dans `Router.js`.

---

## 1. Technologies

| Rôle | Outil |
|---|---|
| Structure | HTML5 |
| Style | Sass (compilé en `scss/main.css`) + Bootstrap 5.3.8 |
| Icônes | Bootstrap Icons |
| Interactions | JavaScript natif en modules ES6 (pas de framework) |
| Graphiques (statistiques admin) | Chart.js |
| Serveur | Node.js + Express |
| Déploiement | Heroku |
| Environnement local (optionnel) | Docker |

Pourquoi Bootstrap : respect de standards connus, grille responsive et gain de temps sur le CSS.
Pourquoi Sass : modifier les couleurs par défaut de Bootstrap et surcharger le CSS pour appliquer la charte du site.
Pourquoi JavaScript natif : maîtriser les bases du langage sans dépendre d'un framework.

## 2. Architecture du projet

```
vite-et-gourmand-front/
├─ index.html              Page unique : header, zone #main-page, footer
├─ server.js               Serveur Express local (proxy /api vers l'API Heroku)
├─ server_prod.js          Serveur Express de production (utilisé par Heroku)
├─ Dockerfile
├─ package.json
├─ Assets/Images/          Photos, logo, favicon, image par défaut des menus
├─ Pages/                  Contenu HTML de chaque page (injecté par le routeur)
│  ├─ accueil.html, 404.html
│  ├─ Auth/                connexion, inscription, mot de passe oublié / réinitialisation
│  ├─ Menus/               nos_menus.html, menu_detail.html
│  ├─ Commande/Client/     commander, espace client, profil client
│  ├─ Contact/             contact.html
│  ├─ Mention_legale/      mentions légales, CGV
│  ├─ Employer/            pages de l'espace employé
│  └─ Admin/               pages de l'espace administrateur
├─ Router/
│  ├─ Route.js             Classe Route
│  ├─ allRoutes.js         Liste des 32 routes de l'application
│  └─ Router.js            Logique de navigation
├─ Script/
│  ├─ config.js            URL de l'API
│  ├─ script.js            Fonctions communes (cookies, rôles, nettoyage des données)
│  ├─ Public/              Accueil (header, footer, témoignages) et authentification
│  ├─ Menus/               Nos menus et détail d'un menu
│  ├─ Commande/            Tunnel de commande
│  ├─ Client/              Espace client
│  ├─ Contact/             Formulaire de contact
│  ├─ Employer/            Espace employé
│  └─ Admin/               Espace administrateur
└─ scss/
   ├─ main.scss            Point d'entrée Sass (importe tous les fichiers ci-dessous)
   ├─ _custom.scss         Charte graphique : couleurs, polices, variables Bootstrap
   ├─ _header.scss, _footer.scss, _accueil.scss, _nos_menus.scss, _menu_detail.scss, ...
   └─ main.css             Fichier compilé chargé par index.html
```

## 3. Rôles et connexion

| Rôle | Accès |
|---|---|
| Visiteur | Accueil, Nos menus, détail d'un menu, contact, mentions légales, inscription, connexion |
| `ROLE_CLIENT` | + commander, espace client (suivi, annulation, avis), profil |
| `ROLE_EMPLOYE` | + gestion des commandes, des avis, des menus, plats, thèmes, régimes, allergènes et tags |
| `ROLE_ADMIN` | + statistiques, comptes employés et utilisateurs, horaires, suppressions |

À la connexion, l'API renvoie un jeton JWT. Le front stocke deux cookies :

- `accesstoken` : le jeton, envoyé dans l'en-tête `Authorization: Bearer ...` de chaque appel à l'API ;
- `role` : le rôle de l'utilisateur, utilisé pour l'affichage.

La vraie sécurité est assurée par l'API, qui vérifie le jeton et le rôle sur chaque route. Le front ne fait que l'affichage.
Toutes les données reçues de l'API sont nettoyées avant d'être insérées dans la page (`sanitizeHtml` / `sanitizeInput` dans `script.js`), pour éviter les failles XSS.

---

## 4. Connexion à l'API

L'URL de l'API est définie dans `Script/config.js`.

Par défaut, le front appelle **toujours l'API de production**, même en local :

```js
export const API_URL = 'https://vite-et-gourmand-api-2b0eeb54e8d5.herokuapp.com';
```

Pour travailler avec l'API Symfony lancée en local (`http://127.0.0.1:8000`), réactiver le bloc commenté :

```js
export const API_URL = dev
    ? 'http://127.0.0.1:8000'
    : 'https://vite-et-gourmand-api-2b0eeb54e8d5.herokuapp.com';
```

Ne pas oublier de remettre la version production avant de déployer.

---

## 5. Affichage mobile

Chaque page a été adaptée au mobile (moins de 768 px de large) sans modifier l'affichage sur ordinateur :

- **Nos menus :** barre de recherche fixe, filtres dans un panneau qui s'ouvre depuis le bas, thèmes en pastilles, cartes photo.
- **Détail d'un menu :** photo plein écran avec titre et badges en surimpression, galerie au glissé du doigt, barre « Commander » fixée en bas.
- **Espaces client, employé et admin :** cartes de commandes et d'avis repliables (« Voir le détail »), onglets en grille, boutons pleine largeur.
- **Menus et tags :** association d'un tag à un menu par simple appui (le glisser-déposer ne fonctionne pas au doigt).

Les règles mobiles sont regroupées à la fin de chaque fichier Sass, dans un bloc `@include media-breakpoint-down(md)`.

---
## 6. Installation en local

### Installer Node.js (Windows, via Chocolatey, s'il n'est pas déjà installé)

https://nodejs.org/en/download

```powershell
Etape 1 : powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
Etape 2 : choco install nodejs-lts -y


```
### Installation des dépendances

```bash
npm install
```

Cette commande installe Express, Bootstrap 5.3.8, Bootstrap Icons, Chart.js et http-proxy-middleware (voir `package.json`).
sinon manuellement :

## Installation du serveur Express
```bash
npm install express
```
## Installation du framework css bootstrap

pourquoi : respect des normes standardiser, est gain de temps sur le css du site
installation de bootstrap
```bash
npm install bootstrap
```

## Instalation de la version 5.3 de Bootstrap
```bash
npm install bootstrap@v5.3.8
```

## Instalation de la version 5.3 de Bootstrap icon
```bash
npm i bootstrap-icons
```

## Installation de Sass 
But :  possibilité de modifier les couleurs par défaut de bootstrap est surchargé le css pour appliqué notre propre style.

### Verification des versions et netoyage des cookies

## Verification de la version de Node.js
```bash
node -v 
```

## Verification de la version de npm
```bash
npm -v
```

## Lancement du serveur
```bash
node server.js
```

## Netoyage des COOKIES peut creer des problemes avec les roles
taper dans la console 
document.cookie = "accesstoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";

## Installation de chart JS
```bash
npm install chart.js
```

```
```
## 7. Compiler le Sass

Après chaque modification d'un fichier `.scss`, recompiler `main.css` :

```bash
npx sass scss/main.scss scss/main.css --no-source-map
```
Ou avec l'extension VS Code **Live Sass Compiler** (bouton « Watch Sass »).
Sans cette étape, les modifications de style n'apparaissent pas sur le site.

### Test l'affichage selon le rôle (sans se connecter)

Client :
```js
document.cookie = "accesstoken=fake-token-123; path=/; SameSite=Lax";
document.cookie = "role=ROLE_CLIENT; path=/; SameSite=Lax";
location.reload();
```

Employé :
```js
document.cookie = "accesstoken=fake-token-123; path=/; SameSite=Lax";
document.cookie = "role=ROLE_EMPLOYE; path=/; SameSite=Lax";
location.reload();
```

Admin :
```js
document.cookie = "accesstoken=fake-token-123; path=/; SameSite=Lax";
document.cookie = "role=ROLE_ADMIN; path=/; SameSite=Lax";
location.reload();
```

Se déconnecter / nettoyer les cookies (utile si les rôles s'affichent mal) :
```js
document.cookie = "accesstoken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
location.reload();
```

### 8 Lancer le site

```bash
node server.js
```

Puis ouvrir http://localhost:3000

### 8.1 Avec Docker (optionnel)

Le `Dockerfile` construit une image Node 20 qui lance `server_prod.js` sur le port 3000.
Le `compose.dev.yml` du dépôt back démarre ensemble le back, MySQL, le front et phpMyAdmin.

---

## 8. Déploiement sur Heroku

### 8.1 Installer et vérifier les outils

```bash
npm install -g heroku
git --version
heroku --version
node -v
```

### 8.2 Préparer le projet

# Se déplacer dans le dossier à déployer

```bash
cd D:\wamp64\www\vite-et-gourmand-front
heroku login
```

# Initialiser Git
git init
git add .
git commit -m "first deploy"

# Créer un compte sur heroku et lié à GIThub en ayant merger sur la branch main  et se connecté
heroku login

heroku create vite-et-gourmand

Le fichier `package.json` doit lancer le serveur de production :

```json
"main": "server_prod.js",
"scripts": {
  "start": "node server_prod.js"
}
```

# Modification de fichier package.json
{
  "name": "vite-et-gourmand",
  "version": "1.0.0",
  "description": "Vite et Gourmand - site web",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^5.2.1",
    "bootstrap": "^5.3.8",
    "bootstrap-icons": "^1.13.1",
    "http-proxy-middleware": "^3.0.5"
  }
}


### 8.3 Créer l'application et la relier au dépôt (une seule fois)

```bash
heroku create vite-et-gourmand
heroku git:remote -a vite-et-gourmand
git remote -v
```

# Faire le lien avec heroku 
// fait le lien Heroku au projet actuelle
heroku git:remote -a vite-et-gourmand

### 8.4 Déployer le projet

Après avoir fusionné les modifications sur la branche `main` :

```bash
git push heroku main
heroku open
```

### 8.5 En cas de problème

# SI sa plante Vérifier les logs Heroku
```bash
heroku logs --tail
```

Revenir à la version précédente :

```bash
heroku releases:rollback
```
## 10. Dépannage

| Problème | Solution |
|---|---|
| Les modifications de style n'apparaissent pas | Recompiler le Sass puis vider le cache du navigateur (Ctrl + F5). |
| Les menus du header ne correspondent pas au rôle | Nettoyer les cookies . |
| Erreur 500 sur toutes les routes de l'API | Voir `heroku logs --tail -a vite-et-gourmand-api`. Si le message contient `max_questions`, la limite gratuite de JawsDB (3 600 requêtes SQL par heure) est atteinte : elle se remet à zéro une heure après le dépassement. |
| Le site appelle la mauvaise API | Vérifier `Script/config.js` |
| Besoin de logs détaillés dans la console | Passer `let DebugConsole = true;` en haut du script de la page concernée. |
