/* ===============================
   Ce fichier centralise les intéractions et les effets concernant le header
   RÉSUMÉ DU FONCTIONNEMENT
   =============================== */
// 1. SCROLL EFFECT
// 2. ACTIVE LINK MANAGEMENT
// 3. MOBILE MENU CLOSE ON LINK CLICK
// 4. CLOSE ON OUTSIDE CLICK
// 5. BURGER ICON / CLOSE ICON TOGGLE

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

  /* ========================================
     SECTION 0 : GESTION DU X POUR FERMER LE MENU
     ======================================== */

  // Affiche le X et cache le hamburger quand le menu s'ouvre
  navbarCollapse.addEventListener('show.bs.collapse', () => {
    burgerIcon.classList.add('d-none');
    closeIcon.classList.remove('d-none');
  });

  // Cache le X et affiche le hamburger quand le menu se ferme
  navbarCollapse.addEventListener('hide.bs.collapse', () => {
    burgerIcon.classList.remove('d-none');
    closeIcon.classList.add('d-none');
  });

  /* ========================================
     SECTION 1 : EFFET DE SCROLL SUR LE HEADER
     ======================================== */

  //  Écoute l'événement 'scroll' sur la fenêtre se déclenche à chaque fois que l'utilisateur scroll
  window.addEventListener('scroll', () => {
    
    // Vérifie la position verticale du scroll (en pixels)
    // window.scrollY retourne le nombre de pixels défilés verticalement
    // Si scrollY > 10px, on ajoute une ombre supplémentaire au header
    if (window.scrollY > 10) {
      
      // Ajoute la classe 'scrolled' à la navbar Cette classe ajoute une ombre plus prononcée voir CSS
      navbar.classList.add('scrolled');
      
    } else {
      
      // Retire la classe 'scrolled' si le scroll est en haut cela remet l'ombre subtile initiale
      navbar.classList.remove('scrolled');
    }
  });

  /* ========================================
     SECTION 2 : GESTION DU LIEN ACTIF
     ======================================== */

  // Fonction qui met à jour le lien actif selon la route actuelle
  function updateActiveLink() {
    
    // Récupère le chemin de l'URL actuelle
    // window.location.pathname retourne la partie après le domaine
    const currentPath = window.location.pathname;

    // Boucle sur CHAQUE lien de navigation forEach exécute la fonction pour chaque élément de la liste
    navLinks.forEach(link => {
      
      // Récupère l'attribut 'href' du lien (sa destination)
      // getAttribute('href') retourne la valeur de l'attribut href
      const href = link.getAttribute('href');
      
      // Condition 1: Le lien correspond exactement à la route actuelle
      // Condition 2: Cas spécial pour la page d'accueil (/ == /)
      // Si l'une de ces conditions est vraie, c'est le lien actif
      if (href === currentPath || (currentPath === '/' && href === '/')) {
        
        // Ajoute la classe 'active' au lien (underline)
        link.classList.add('active');
        
        // Ajoute l'attribut aria-current='page' pour l'accessibilité
        // Cela indique aux lecteurs d'écran que c'est la page actuelle
        link.setAttribute('aria-current', 'page');
        
      } else {
        
        // Retire la classe 'active' si ce n'est pas le lien actif
        link.classList.remove('active');
        
        // Retire l'attribut aria-current pour les liens inactifs
        link.removeAttribute('aria-current');
      }
    });
  }

  //  Appel initial de la fonction au chargement de la page
  // Cela met en évidence le lien correspondant à l'URL actuelle
  updateActiveLink();

  // Écoute l'événement 'popstate'
  // Cet événement se déclenche quand l'utilisateur navigue (bouton retour, etc.)
  // Dans une SPA (Single Page App), cet événement signale un changement de route
  window.addEventListener('popstate', updateActiveLink);

  /* ========================================
     SECTION 3 : FERMER LE MENU MOBILE AU CLIC
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
    });
  });

  /* ========================================
     SECTION 4 : FERMER LE MENU EN CLIQUANT DEHORS
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
    }
  });
});
