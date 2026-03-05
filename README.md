#Vite est Gourmand
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


#Installation
installation de bootstrap 1. se deplacer dans la racine du projet 2 executer la commande suivante npm install bootstrap

#deploiment
