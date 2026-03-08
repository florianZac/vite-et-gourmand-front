/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */

import Route from "./Route.js";

/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */
export const allRoutes = [
   new Route("/", "Accueil", "Pages/accueil.html", [], "/Script/accueil-temoignage.js", true),
   new Route("/contact", "Contact", "Pages/Contact/contact.html", [], "/Script/contact.js", true),
   new Route("/Mentions_legale", "Mentions_legale", "Pages/Mention_legale/Mentions_legale.html", [], "", true),
   new Route("/Mentions_CGV", "Mentions_CGV", "Pages/Mention_legale/Mentions_CGV.html", [], "", true),
   new Route("/login", "Connexion", "Pages/Auth/login.html", ["disconnected"], "/Script/connection.js", true),
   new Route("/inscription", "Inscription", "Pages/Auth/inscription.html", ["disconnected"], "/Script/inscription.js", true),
   new Route("/reset_login", "Resetpassword", "Pages/Auth/reset-password.html", ["disconnected"], "/Script/reset-password.js", true),
   new Route("/commander", "Commander", "Pages/Commande/Client/commander.html", ["client","employee","admin"], "/Script/commander.js", true), 


   //new Route("/nos_menu", "Nos Menus", "Pages/Menus/nos_menus.html", [], "", true),
];

/* =====================================================
   NOM DU SITE (utilisé pour mettre à jour le titre du site internet dans la barre du haut)
   ===================================================== */
export const websiteName = "Vite & Gourmand";