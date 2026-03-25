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
   new Route("/compte_client", "compte client", "Pages/Commande/Client/compte_client.html", ["ROLE_CLIENT"], "/Script/Client/compte_client.js", true),
   new Route("/mon_compte_profil", "compte client profil", "Pages/Commande/Client/compte_client_profil.html", ["ROLE_CLIENT"], "/Script/Client/compte_client_profil.js", true), 

   /* Role EMPLOYER (ROLE_EMPLOYE) */
   new Route("/gestion_commande_employer", "Gestion Commande Employer", "Pages/Employer/gestion_commande_employer.html", ["ROLE_EMPLOYE"], "/Script/Employer/compte_employer_gestion_commandes.js", true),
   new Route("/gestion_avis_employer", "Gestion Avis Employer", "Pages/Employer/gestion_avis_employer.html", ["ROLE_EMPLOYE"], "/Script/Employer/compte_employer_gestion_avis.js", true),
   new Route("/gestion_menus_employer", "Gestion Menus Employer", "Pages/Employer/gestion_menus_employer.html", ["ROLE_EMPLOYE"], "/Script/Employer/compte_employer_gestion_menus.js", true),
   new Route("/gestion_allergene_employer", "Gestion allergene Employer", "Pages/Employer/gestion_allergene_employer.html", ["ROLE_EMPLOYE"], "/Script/Employer/compte_employer_gestion_allergene.js", true),
   new Route("/gestion_plat_employer", "Gestion Plat Employer", "Pages/Employer/gestion_plat_employer.html", ["ROLE_EMPLOYE"], "/Script/Employer/compte_employer_gestion_plat.js", true),
   new Route("/gestion_theme_regime_employer", "Gestion Theme Regime Employer", "Pages/Employer/gestion_theme_regime_employer.html", ["ROLE_EMPLOYE"], "/Script/Employer/compte_employer_gestion_theme_regime.js", true),
   /* Role ADMIN (ROLE_ADMIN)*/
   new Route("/statistiques", "Compte Admin", "Pages/Admin/compte_admin.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin.js", true),
   new Route("/gestion_horraire", "Compte Admin Gestion Horraire", "Pages/Admin/compte_admin_gestion_horraire.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_horraire.js", true),
   new Route("/gestion_plat", "Compte Admin Gestion plat", "Pages/Admin/compte_admin_gestion_plat.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_plat.js", true),
   new Route("/gestion_theme_regimes", "Compte Admin Gestion Theme Regime", "Pages/Admin/compte_admin_gestion_theme_regime.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_theme_regime.js", true),
   new Route("/gestion_allergene", "Compte Admin Gestion Allergene", "Pages/Admin/compte_admin_gestion_allergene.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_allergene.js", true),
   new Route("/gestion_menus", "Compte Admin Gestion Menus", "Pages/Admin/compte_admin_gestion_menus.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_menus.js", true),
   new Route("/gestion_profil", "Compte Admin Profil", "Pages/Admin/compte_admin_profil.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_profil.js", true),
   new Route("/gestion_utilisateurs", "Compte Admin Gestion Utilisateur", "Pages/Admin/compte_admin_gestion_utilisateurs.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_utilisateurs.js", true),
   new Route("/gestion_employes", "Compte Admin Gestion Employe", "Pages/Admin/compte_admin_gestion_employe.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_employe.js", true),
   new Route("/gestion_avis", "Compte Admin Gestion Avis", "Pages/Admin/compte_admin_gestion_avis.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_avis.js", true),
   new Route("/gestion_commandes", "Compte Admin Gestion Commandes", "Pages/Admin/compte_admin_gestion_commandes.html", ["ROLE_ADMIN"], "/Script/Admin/compte_admin_gestion_commandes.js", true),
];

/* =====================================================
   NOM DU SITE (utilisé pour mettre à jour le titre du site internet dans la barre du haut)
   ===================================================== */
export const websiteName = "Vite & Gourmand";