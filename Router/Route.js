
export default class Route {
  constructor(url, title, pathHtml, authorize = [], pathJS = "", reloadJS = false) {
    this.url = url;         // URL SPA
    this.title = title;     // Titre de la page
    this.pathHtml = pathHtml; // Chemin relatif vers le HTML
    this.pathJS = pathJS;   // Chemin JS spécifique à la page
    this.authorize = authorize; // Roles autorisés
    this.reloadJS = reloadJS;   // Recharger JS à chaque visite
  }
}



/** Tableau de chaine de charactere perméttant de faire le choix pour un utilisateur spécifique 
 * tout le monde peut y acceder (cas visiteur et public access)
 * ['connected'] -> Réserver aux utilisateurs connectée
 * ['disconnected] -> Réserver aux utilisateurs admin et client et employée
 * ['client'] -> Réserver aux utilisateurs ayant le role client
 * ['employée'] -> Réserver aux utilisateurs ayant le role employée
 * ['admin] -> Réserver aux utilisateurs ayant le role admin
 */