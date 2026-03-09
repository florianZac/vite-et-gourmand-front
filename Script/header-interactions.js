/* ===============================
   Ce fichier centralise les intéractions et les effets concernant le header
   RÉSUMÉ DU FONCTIONNEMENT
   =============================== */
  // 0. GESTION DE L'OUVERTURE / FERMETURE DU MENU BURGER
  // 1. EFFET DE SCROLL SUR LE HEADER
  // 2. FERMER LE MENU MOBILE AU CLIC
  // 3. FERMER LE MENU EN CLIQUANT DEHORS
  // 4. SMOOTH SCROLL AVEC JAVASCRIPT

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

  // Déclare les variables globales
  // lastScrollTop = sauvegarde la dernière position du scroll pour détecter la direction
  let lastScrollTop = 0;
  // isSmoothing = indique si un smooth scroll est en cours (pour éviter les conflits)
  let isSmoothing = false;

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
    } else {
      // On scroll vers le HAUT = affiche le header
      // navbar.style.transform = '0' = ramène le header à sa position normale (en haut de l'écran)
      navbar.style.transform = '0';
    }

    // Met à jour la position de scroll pour la prochaine vérification
    // Si on est tout en haut (currentScroll <= 0), lastScrollTop = 0
    // Sinon, lastScrollTop = la position actuelle du scroll
    // Cela permet de détecter la direction du scroll la prochaine fois
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });

  /* ========================================
     SECTION 2 : GESTION DU LIEN ACTIF
     ======================================== */

  // La gestion du lien actif est désormais centralisée dans Router.js
  // via la fonction updateActiveLink() appelée à chaque changement de page
  // Raison : pushState (utilisé par navigate()) ne déclenche pas popstate,
  // donc seul le Router peut savoir quand la page change réellement

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
      }
    });
  });

  
/* ========================================
     SECTION 5 : MISE À JOUR DU HEADER SELON LA CONNEXION
     - 1. Si un token JWT existe dans le localStorage -> l'utilisateur est connecté
     - 2. Le bouton "Connexion" devient : icône user + prénom -> lien vers /compte
     - 3. Le bouton "Inscription" devient : "Déconnexion"
     - 4. Si pas de token -> on laisse les boutons par défaut
     ======================================== */

  // Récupère les deux boutons du header via leurs ID
  const btnConnexion = document.getElementById('btn-header-connexion');
  const btnInscription = document.getElementById('btn-header-inscription');

  // Fonction qui met à jour les boutons selon l'état de connexion
  function updateHeaderAuth() {

    // Récupère le token JWT depuis le localStorage
    const token = localStorage.getItem('token');

    // Si pas de token -> l'utilisateur n'est pas connecté
    // On remet les boutons dans leur état par défaut
    if (!token) {
      if (btnConnexion) {
        btnConnexion.href = '/login';
        btnConnexion.innerHTML = 'Connexion';
      }
      if (btnInscription) {
        btnInscription.href = '/inscription';
        btnInscription.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Inscription';

        // On retire le listener de déconnexion si il existe
        btnInscription.removeAttribute('id-logout');
      }
      return;
    }

    // Si on a un token -> on le décode pour récupérer le prénom
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      // Récupère le prénom depuis le payload
      const firstName = decoded.firstName || decoded.prenom || decoded.username || 'Mon compte';

      // BOUTON 1 : "Connexion" -> icône user + prénom -> lien vers /compte
      if (btnConnexion) {
        btnConnexion.href = '/compte';
        btnConnexion.innerHTML = `<i class="bi bi-person"></i> ${firstName}`;
      }

      // BOUTON 2 : "Inscription" -> "Déconnexion"
      if (btnInscription) {
        btnInscription.href = '#';
        btnInscription.innerHTML = '<i class="bi bi-box-arrow-right"></i> Déconnexion';

        // Ajoute le listener de déconnexion
        if (!btnInscription.hasAttribute('data-logout')) {
          btnInscription.setAttribute('data-logout', 'true');
          btnInscription.addEventListener('click', (e) => {
            e.preventDefault();
            // Supprime le token
            localStorage.removeItem('token');
            // Remet les boutons en mode "non connecté"
            updateHeaderAuth();
            // Redirige vers l'accueil
            window.location.href = '/';
          });
        }
      }

    } catch (err) {
      // Si le token est invalide, on le supprime et on remet l'état par défaut
      console.error('Token JWT invalide:', err);
      localStorage.removeItem('token');
    }
  }

  // Appelle la fonction au chargement de la page
  updateHeaderAuth();

});