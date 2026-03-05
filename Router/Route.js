export default class Route {
  constructor(url, title, pathHtml, pathJS = "",authorize, reloadJS = false) {
    this.url = url;
    this.title = title;
    this.pathHtml = pathHtml;
    this.pathJS = pathJS;
    this.authorize = authorize; // Autorisation d'accès au page
    //this.reloadJS = reloadJS; // rechargement rapide
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