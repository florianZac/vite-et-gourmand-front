import {getRole } from '../../script.js';

/* ===============================
    Ce fichier centralise les intéractions et les effets concernant le header
    RÉSUMÉ DU FONCTIONNEMENT
      0. GESTION DE L'OUVERTURE / FERMETURE DU MENU BURGER
      1. EFFET DE SCROLL SUR LE HEADER
      2. FERMER LE MENU MOBILE AU CLIC
      3. FERMER LE MENU EN CLIQUANT DEHORS
      4. SMOOTH SCROLL AVEC JAVASCRIPT
      5. GESTION CONNEXION / DÉCONNEXION / BOUTON UTILISATEUR
   =============================== */
// Attend que le DOM soit complètement chargé avant d'exécuter le code afin de garantir que tous les éléments HTML sont disponibles
document.addEventListener('DOMContentLoaded', () => {

  
  // Sélectionne la navbar avec la classe 'custom-navbar' et retourne le premier élément 
  const navbar = document.querySelector('.custom-navbar');
  
  // Sélectionne TOUS les liens de navigation avec la classe 'nav-link'
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  // Sélectionne le conteneur le menu qui apparaît/disparaît
  const navbarCollapse = document.querySelector('.navbar-collapse');

  // Sélectionne les icônes burger et X pour l'affichage/masquage
  const burgerIcon = document.querySelector('.burger-icon');
  const closeIcon = document.querySelector('.close-icon');

  // Sélectionne le Bouton utilisateur affiche le prénom et redirige vers le compte
  const btnUser = document.getElementById('btn-user');
  // Sélectionne le Bouton connexion (visible quand déconnecté) -> redirige vers /login
  const btnConnexion = document.getElementById('btn-header-connexion');
  // Sélectionne le Bouton déconnexion (visible quand connecté) -> déconnecte et redirige vers /
  const btnSignout = document.getElementById('signout-btn');
  // Sélectionne le Bouton inscription (visible quand déconnecté) -> redirige vers /inscription
  const btnInscription = document.getElementById('btn-header-inscription');
  // Sélectionne Tous les liens du header
  const headerLinks = document.querySelectorAll('.custom-navbar a');

  // Déclare les variables globales
  // lastScrollTop = sauvegarde la dernière position du scroll pour détecter la direction
  let lastScrollTop = 0;
  // isSmoothing = indique si un smooth scroll est en cours (pour éviter les conflits)
  let isSmoothing = false;
  let DebugConsole = false;

  // récupère le role de l'utilisateur.
  const role = getRole();
  // Met à jour le bouton du compte d'après le role
  updateUserButtonRole(role);

  /* ========================================
      SECTION 0 : GESTION DU X POUR FERMER LE MENU
     ======================================== */

  // Affiche le X et cache le hamburger quand le menu s'ouvre
  navbarCollapse.addEventListener('show.bs.collapse', () => {
    burgerIcon.classList.add('d-none');
    closeIcon.classList.remove('d-none');
    if (DebugConsole) console.log("Menu ouvert : burger caché, X visible");
  });

  // Cache le X et affiche le hamburger quand le menu se ferme
  navbarCollapse.addEventListener('hide.bs.collapse', () => {
    burgerIcon.classList.remove('d-none');
    closeIcon.classList.add('d-none');
    if (DebugConsole) console.log("Menu fermé : burger visible, X caché");
  });

  /* ========================================
      SECTION 1 : EFFET DE SCROLL SUR LE HEADER
     ======================================== */
  
  // Écoute l'événement 'scroll' sur la fenêtre
  // Cette fonction s'exécute à chaque fois que l'utilisateur scrolle
  window.addEventListener('scroll', () => {
    
    // Si un smooth scroll est en cours, on sort de la fonction (return)
    // Cela empêche le header de bouger pendant le smooth scroll
    if (isSmoothing) return; 
    
    // Récupère la position actuelle du scroll (en pixels depuis le haut)
    // window.pageYOffset = combien de pixels on a scrollé vers le bas
    // document.documentElement.scrollTop = alternative si pageYOffset ne marche pas
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Vérifie si on scroll vers le BAS (si la position actuelle est PLUS GRANDE que la dernière position)
    if (currentScroll > lastScrollTop) {
      // On scroll vers le BAS = cache le header
      // navbar.style.transform = '-100px' = déplace le header vers le haut de -100 pixels
      // Comme le header fait 80px de haut, il disparaît complètement de l'écran
      navbar.style.transform = '-100px';
      if (DebugConsole) console.log("Scroll DOWN, header caché", currentScroll);
    } else {
      // On scroll vers le HAUT = affiche le header
      // navbar.style.transform = '0' = ramène le header à sa position normale (en haut de l'écran)
      navbar.style.transform = '0';
      if (DebugConsole) console.log("Scroll UP, header visible", currentScroll);
    }
    // Met à jour la position de scroll pour la prochaine vérification
    // Si on est tout en haut (currentScroll <= 0), lastScrollTop = 0
    // Sinon, lastScrollTop = la position actuelle du scroll
    // Cela permet de détecter la direction du scroll la prochaine fois
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });

  /* ========================================
      SECTION 2 : FERMER LE MENU MOBILE AU CLIC
     ======================================== */

  // Boucle sur CHAQUE lien de navigation
  // Cela ajoute un listener au clic pour chaque lien
  navLinks.forEach(link => {
    
    // Écoute le clic sur le lien
    // Si l'utilisateur clique sur un lien, la fonction s'exécute
    link.addEventListener('click', () => {
      
      // Crée une instance de Bootstrap Collapse
      // Collapse est une classe Bootstrap qui gère les menus qui apparaissent/disparaissent
      // navbarCollapse = le menu qu'on veut contrôler
      // { toggle: false } = on ne veut pas basculer (toggle), on veut juste le cacher
      const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
        toggle: false
      });
      
      // Cache le menu collapse
      // Cette méthode ferme le menu
      bsCollapse.hide();
      if (DebugConsole) console.log("Lien clic : menu mobile fermé", link);
    });
  });

  /* ========================================
      SECTION 3 : FERMER LE MENU EN CLIQUANT DEHORS
     ======================================== */

  // Écoute TOUS les clics sur la page
  // Cette fonction s'exécute à chaque clic n'importe où
  document.addEventListener('click', (e) => {
    
    // Récupère le bouton burger (le bouton menu mobile)
    const toggler = document.querySelector('.navbar-toggler');
    
    // Condition 1: Le clic n'est PAS sur la navbar (en dehors du menu)
    // Condition 2: Le menu collapse est actuellement OUVERT (visible)
    if (!navbar.contains(e.target) && navbarCollapse.classList.contains('show')) {
      
      // Simule un clic sur le bouton toggler
      // Cela ferme le menu en appelant le comportement du bouton burger
      toggler.click();
      if (DebugConsole) console.log("Clic hors menu : menu fermé");
    }
  });

  /* ========================================
      SECTION 4 : SMOOTH SCROLL AVEC JAVASCRIPT
     ======================================== */
  // Trouve TOUS les liens qui pointent vers des ancres (#)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    
    // Écoute le clic sur chaque lien ancre
    link.addEventListener('click', (e) => {
      
      // Empêche le comportement par défaut du lien (qui ferait un scroll instantané)
      e.preventDefault();
      
      // Récupère l'ID cible en enlevant le # du href
      // .substring(1) enlève le premier caractère (le #) et retourne "section_1"
      const targetId = link.getAttribute('href').substring(1);
      
      // Récupère l'élément DOM qui a cet ID
      const target = document.getElementById(targetId);
      
      // Vérifie que l'élément cible existe vraiment
      if (target) {
        
        // Force le header à rester visible pendant le smooth scroll
        navbar.style.transform = 'translateY(0)';
        
        // Calcule la position exacte où scroller
        // getBoundingClientRect().top = distance entre le haut de l'écran et l'élément cible
        // window.scrollY = position actuelle du scroll
        // - headerHeight = recule de 80px pour que le header ne cache pas le contenu
        const headerHeight = 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        
        // crée une animation smooth d'1 seconde environ vers la position calculée
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        if (DebugConsole) console.log("Smooth scroll vers :", targetId, "position :", targetPosition);
      }
    });
  });

  // Scroll en haut de la page pour tous les liens HEADER sauf les ancres
  headerLinks.forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      if (!href.startsWith('#')) { 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (DebugConsole) console.log("Clic lien header: scroll top", href);
      }
    });
  });

  window.addEventListener('popstate', () => {
    window.scrollTo(0, 0);
    if (DebugConsole) console.log("Popstate event: scroll top");
  });

  /* ========================================
      FONCTION : MISE A JOUR DU LIEN DU BOUTON POUR ACCES A SON COMPTE EN FONCTION DU RETOUR TOKEN
     ======================================== */
  function updateUserButtonRole(role) {
    if (!btnUser || !role) return;

    let href = "#"; // valeur par défaut 

    switch (role) {
      case "ROLE_CLIENT":
          href = "/compte_client";
          break;
      case "ROLE_EMPLOYE":
          href = "/compte_employer";
          break;
      case "ROLE_ADMIN":
          href = "/statistiques";
          break;
      default:
          href = "#";
    }

    if (DebugConsole) {
      console.log("[updateUserButtonRole] role :", role);
      console.log("[updateUserButtonRole] href :", href);
    }
    // Modifie le le lien
    btnUser.href = href;

    // Affiche le bouton
    btnUser.classList.remove("d-none");
  }

});