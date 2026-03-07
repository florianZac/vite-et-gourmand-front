# Vite est Gourmand
Ce site est un site vitrine pour le restaurant vite et gourmand

Utilisation d'un Le framework JavaScript

1.1 Le routage
But :
Pour permetre d'avoir un cadre de travail lors du développement de la partie front du site.
Utilisation d'un système de routage due au limite du HTML dans le but de ne pas dupliquer 
les page header, footer.
ainsi que centraliser les données au meme endroits
Le routage utilise une table de correspondance qui associe des URL perméttant de mieux gérer les droits des différents role (invitée,client,employée,admin).

composé de 3 fichiers : 
Le fichier Route.js : définit une classe Route qui représente une route de l'application. Chaque route a une URL, un titre, un chemin vers un fichier HTML, un chemin vers un fichier JavaScript

Le fichier allRoutes.js : crée un tableau « allRoutes » contenant toutes les routes de l'application. Chaque route est créée en utilisant la classe « Route » avec les paramètres appropriés. Il définit également la variable « websiteName », qui représente le nom du site web

Le fichier router.js : importe la classe Route et les variables « allRoutes » et « websiteName » du fichier allRoutes.js. C’est lui qui contient la logique de routage.

# Architecture du Front
/project-root
├─ Pages/
│ ├─ 404.html
│ ├─ home.html
│ ├───Auth/
│ ├─ inscription.html
│ ├─ login.html
│ ├───Auth/
│ ├─ commander.html
│ ├───Contact/
│ ├─ contact.html
│ ├───Mention_legale/
│ ├─ Mentions_CGV.html
│ ├─ Mentions_legale.html
├─ Router/
│ ├─ Router.js 
│ ├─ Route.js 
│ └─ allRoutes.js
├─ Script/
│ ├─ script.js 
├─ scss/
│ ├─ _custom.scss
│ ├─ main.css
│ ├─ main.css.map 
│ ├─ main.scss


# NPM windows installation via choco pour s'il n'est pas déjà installer.
https://nodejs.org/en/download
Etape 1 : powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
Etape 2 : choco install nodejs-lts -y
Etape 3 : Vérifier les versions

# Verification de la version de Node.js
node -v #

# Verification de la version de npm
npm -v #

# Installation du serveur Express
npm install express
# Lance le serveur
node server.js


# Netoyage des COOKIES
taper dans la console 
document.cookie = "accesstoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";




# Installation du framework css bootstrap

pourquoi : respect des normes standardiser, est gain de temps sur le css du site
installation de bootstrap 1. 

npm install bootstrap


# Instalation de la version 5.3 de Bootstrap
npm install bootstrap@v5.3.8

# Instalation de la version 5.3 de Bootstrap icon
npm i bootstrap-icons

# Installation de Sass 
But :  possibilité de modifier les couleurs par défaut de bootstrap est surchargé le css pour appliqué notre propre style.









# Déploiment
