/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */

import Route from "./Route.js";

/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */

export const allRoutes = [
   new Route("/", "Accueil", "Pages/home.html", [], "", true),
   new Route("/login", "Connexion", "Pages/Auth/login.html", ["disconnected"], "", true),
   new Route("/contact", "Contact", "Pages/Contact/contact.html", [], "", true),
   new Route("/nos_menu", "Nos Menus", "Pages/Menus/nos_menus.html", [], "", true),
   new Route("/Mentions_legale", "Mentions_legale", "Pages/Mentions_legale/Mentions_legale.html", [], "", true),
   new Route("/Mentions_CGV", "Mentions_CGV", "Pages/Mentions_legale/Mentions_CGV.html", [], "", true),
   new Route("/inscription", "Inscription", "Pages/Auth/inscription.html", ["disconnected"], "", true),
   new Route("/commander", "Commander", "Pages/Commande/commander.html", ["client","employee","admin"], "", true)
];

/* =====================================================
   NOM DU SITE (utilisé pour mettre à jour le titre du site internet dans la barre du haut)
   ===================================================== */
export const websiteName = "Vite & Gourmand";
