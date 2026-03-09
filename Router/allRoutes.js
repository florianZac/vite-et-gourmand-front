/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */

import Route from "./Route.js";

/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */
export const allRoutes = [

   /* Role PUBLIC ACCESS OU VISITEUR */
   new Route("/", "Accueil", "Pages/accueil.html", [], "/Script/accueil-temoignage.js", true),
   new Route("/contact", "Contact", "Pages/Contact/contact.html", [], "/Script/contact.js", true),
   new Route("/Mentions_legale", "Mentions_legale", "Pages/Mention_legale/Mentions_legale.html", [], "", true),
   new Route("/Mentions_CGV", "Mentions_CGV", "Pages/Mention_legale/Mentions_CGV.html", [], "", true),
   new Route("/nos_menu", "Nos Menus", "Pages/Menus/nos_menus.html", [], "/Script/nos_menus.js", true),
   new Route("/detail_menu", "Detail Menus", "Pages/Menus/menu_detail.html", [], "/Script/menu_detail.js", true),

   /* Role DECONNECTER*/
   new Route("/login", "Connexion", "Pages/Auth/login.html", ["disconnected"], "/Script/connection.js", true),
   new Route("/inscription", "Inscription", "Pages/Auth/inscription.html", ["disconnected"], "/Script/inscription.js", true),
   new Route("/reset_login", "Resetpassword", "Pages/Auth/reset-password.html", ["disconnected"], "/Script/reset-password.js", true),

   /* Role CLIENT */
   new Route("/commander", "Commander", "Pages/Commande/Client/commander.html", ["client"], "/Script/commander.js", true), 
   new Route("/compte", "compte_client", "Pages/Commande/Client/compte_client.html", ["client"], "/Script/compte_client.js", true), 
   new Route("/commande", "Commande", "Pages/Commande/Client/commande_client.html", ["client"], "/Script/commande_client.js", true), 

   /* Role EMPLOYER */

   /* Role ADMIN */


];

/* =====================================================
   NOM DU SITE (utilisé pour mettre à jour le titre du site internet dans la barre du haut)
   ===================================================== */
export const websiteName = "Vite & Gourmand";