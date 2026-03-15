/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */

import Route from "./Route.js";

/* =====================================================
   DÉFINITION DES ROUTES DE L'APPLICATION SPA
   ===================================================== */
export const allRoutes = [

   /* Role PUBLIC ACCESS OU VISITEUR */
   new Route("/", "Accueil", "Pages/accueil.html", [], "/Script/Public/Accueil/accueil-temoignage.js", true),
   new Route("/contact", "Contact", "Pages/Contact/contact.html", [], "/Script/Contact/contact.js", true),
   new Route("/Mentions_legale", "Mentions_legale", "Pages/Mention_legale/Mentions_legale.html", [], "", true),
   new Route("/Mentions_CGV", "Mentions_CGV", "Pages/Mention_legale/Mentions_CGV.html", [], "", true),
   new Route("/nos_menu", "Nos Menus", "Pages/Menus/nos_menus.html", [], "/Script/Menus/nos_menus.js", true),
   new Route("/detail_menu", "Detail Menus", "Pages/Menus/menu_detail.html", [], "/Script/Menus/menu_detail.js", true),
   new Route("/reset_login", "forgotpassword", "Pages/Auth/forgot-password.html", [], "/Script/Public/Auth/forgot-password.js", true),
   new Route("/reset-password", "Resetpassword", "Pages/Auth/reset-password.html", [], "/Script/Public/Auth/reset-password.js", true),

   
   /* Role DECONNECTER*/
   new Route("/login", "Connexion", "Pages/Auth/login.html", ["disconnected"], "/Script/Public/Auth/connection.js", true),
   new Route("/inscription", "Inscription", "Pages/Auth/inscription.html", ["disconnected"], "/Script/Public/Auth/inscription.js", true),

   /* Role CLIENT  (ROLE_CLIENT) */
   new Route("/commander", "Commander", "Pages/Commande/Client/commander.html", ["ROLE_CLIENT"], "/Script/Commande/commander.js", true), 
   new Route("/compte_client", "Commande", "Pages/Commande/Client/compte_client.html", ["ROLE_CLIENT"], "/Script/Commande/compte_client.js", true), 
   new Route("/mon_compte_profil", "compte_client_profil", "Pages/Commande/Client/compte_client_profil.html", ["ROLE_CLIENT"], "/Script/Client/compte_client_profil.js", true), 

   /* Role EMPLOYER (ROLE_EMPLOYE) */

   /* Role ADMIN (ROLE_ADMIN)*/


];

/* =====================================================
   NOM DU SITE (utilisé pour mettre à jour le titre du site internet dans la barre du haut)
   ===================================================== */
export const websiteName = "Vite & Gourmand";