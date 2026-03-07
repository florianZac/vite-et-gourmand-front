/* ===============================
   CAROUSEL DE TÉMOIGNAGES
   Gère la navigation entre 5 avis clients différents
   Utilise Bootstrap Icons pour les étoiles
   =============================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================
  // FONCTION PRINCIPALE D'INITIALISATION
  // ========================================
  // Encapsule tout le code pour pouvoir le réappeler plusieurs fois (pour SPA)
  function initTestimonialCarousel() {
    

    // ========================================
    // DONNÉES: Les 5 témoignages
    // ========================================
    // Chaque témoignage contient:
    // - id: identifiant unique
    // - stars: note de 1 à 5 (nombre d'étoiles remplies)
    // - text: le texte du témoignage (entre guillemets)
    // - author: nom de l'auteur
    // - date: date du témoignage (format YYYY-MM-DD)
    const testimonials = [
      {
        id: 1,
        stars: 4, // 4 étoiles remplies + 1 vide
        text: '"Un festin mémorable ! Julie et José ont transformé notre réveillon en un moment magique. Les saveurs étaient tout simplement divines."',
        author: 'Marie D.',
        date: '2024-12-21'
      },
      {
        id: 2,
        stars: 5, // 5 étoiles remplies
        text: '"Service impeccable et mets délicieux. Notre mariage a été un succès grâce à leur professionnalisme et leur passion pour la cuisine."',
        author: 'Jean P.',
        date: '2024-11-15'
      },
      {
        id: 3,
        stars: 2, // 2 étoiles remplies + 3 vides
        text: '"Des produits frais, une présentation soignée et un goût incomparable. C\'est exactement ce que nous cherchions pour notre événement."',
        author: 'Sophie M.',
        date: '2024-10-08'
      },
      {
        id: 4,
        stars: 1, // 1 étoile remplie + 4 vides
        text: '"Julie et José ont dépassé nos attentes. Leurs menus sur mesure et leur écoute nous ont permis de créer un moment inoubliable."',
        author: 'Luc B.',
        date: '2024-09-22'
      },
      {
        id: 5,
        stars: 5, // 5 étoiles remplies
        text: '"Quelle qualité ! Chaque plat était une œuvre d\'art culinaire. Nous n\'hésiterons pas à refaire appel à leurs services."',
        author: 'Claire V.',
        date: '2024-08-10'
      }
    ];

    // ========================================
    // VARIABLES DE CONTRÔLE
    // ========================================
    // currentIndex = indique quel témoignage on affiche actuellement (0 à 4)
    let currentIndex = 0;

    // ========================================
    // SÉLECTEURS DOM
    // ========================================
    // Récupère les éléments HTML qu'on va manipuler
    
    // Le conteneur principal du carousel (la carte de témoignage)
    const carouselContainer = document.querySelector('.temoignages-carousel');
    
    // Les deux boutons de navigation (précédent et suivant)
    // querySelectorAll retourne une liste, on accède par index [0] et [1]
    const prevBtn = document.querySelectorAll('.temoignages-btn-nav')[0];
    const nextBtn = document.querySelectorAll('.temoignages-btn-nav')[1];
    
    // Les 5 petits points de pagination en bas
    const dots = document.querySelectorAll('.temoignages-dot');

    // ========================================
    // VÉRIFICATIONS: Les éléments existent-ils?
    // ========================================
    // Si un élément n'existe pas, la fonction retourne false
    // pour qu'on puisse réessayer plus tard
    
    if (!carouselContainer) {
      return false;  // Carousel container non trouvé
    }
    if (!prevBtn || !nextBtn) {
      return false;  // Boutons de navigation non trouvés
    }
    if (dots.length < 5) {
      return false;  // Dots non trouvés
    }

    /* ========================================
      FONCTION: Générer les étoiles avec Bootstrap Icons
      ======================================== */
    
    // Cette fonction crée des icônes Bootstrap:
    // - Des <i class="bi bi-star-fill"></i> remplies (nombre = count)
    // - Des <i class="bi bi-star"></i> vides (nombre = 5 - count)
    function generateStars(count) {
      let stars = '';
      
      // Ajoute les étoiles REMPLIES (bi-star-fill)
      for (let i = 0; i < count; i++) {
        // étoile remplie de Bootstrap Icons
        stars += '<i class="bi bi-star-fill"></i>';
      }
      
      // Ajoute les étoiles VIDES (bi-star)
      // Si count = 4, on ajoute 1 étoile vide (5 - 4 = 1)
      for (let i = count; i < 5; i++) {
        // étoile vide de Bootstrap Icons
        stars += '<i class="bi bi-star"></i>';
      }
      return stars;  // Retourne le HTML 
    }

    /* ========================================
      FONCTION: Mettre à jour l'affichage
      ======================================== */
    
      // Cette fonction:
      // 1. Récupère le témoignage actuel dans le tableau
      // 2. Génère le HTML avec les données
      // 3. Remplace le contenu du carousel
      // 4. Met à jour les points de pagination (active/inactive)

    function updateCarousel() {
    
      // testimonials[currentIndex] = le témoignage qu'on veut afficher
      // currentIndex commence à 0 et augmente quand on clique sur "Suivant"
      const currentTestimonial = testimonials[currentIndex];
      
      // Génère le HTML
      // On utilise les backticks (`) pour créer une template string
      // ${} permet d'insérer des variables JavaScript dans le texte
      const testimonialHTML = 
        `
          <div class="temoignages-card">
            <!-- Étoiles du testimonial -->
            <div class="temoignages-card-stars mb-3">
              ${generateStars(currentTestimonial.stars)}
            </div>
            
            <!-- Texte du testimonial -->
            <p class="temoignages-card-text">
              ${currentTestimonial.text}
            </p>
            
            <!-- Auteur -->
            <div class="temoignages-card-author">${currentTestimonial.author}</div>
            
            <!-- Date -->
            <div class="temoignages-card-date">${currentTestimonial.date}</div>
          </div>
        `;
      
      // Remplace le contenu par le nouveau HTML via innerHTML 
      carouselContainer.innerHTML = testimonialHTML;
      
      // Met à jour les points de pagination et boucle sur TOUS les dots
      dots.forEach(dot => {
        // Enlève la classe 'active' de TOUS les dots
        dot.classList.remove('active');
      });
      
      // Ajoute la classe 'active' SEULEMENT au dot du témoignage actuel
      // dots[currentIndex] = le dot qui correspond à l'indice actuel
      dots[currentIndex].classList.add('active');
    }

    /* ========================================
      FONCTION: Aller au témoignage suivant
      ======================================== */
    
    // Cette fonction créer une boucle circulaire qui avance d'un témoignage, si on est au dernier, elle revient au premier.
    function nextTestimonial() {
      // (currentIndex + 1) % testimonials.length
      // (4 + 1) % 5 = 5 % 5 = 0 (revient à 0)
      // Si currentIndex = 2
      // (2 + 1) % 5 = 3 % 5 = 3 (passe à 3)
      currentIndex = (currentIndex + 1) % testimonials.length;
      
      // Met à jour l'affichage avec le nouveau témoignage
      updateCarousel();
    }

    /* ========================================
      FONCTION: Aller au témoignage précédent
      ======================================== */
    
    // Cette fonction recule d'un témoignage, si on est au premier, elle va au dernier 
    function prevTestimonial() {
      // (currentIndex - 1 + testimonials.length) % testimonials.length
      // Le "+ testimonials.length" évite les nombres négatifs
      currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
      
      // Met à jour l'affichage avec le nouveau témoignage
      updateCarousel();
    }

    /* ========================================
      FONCTION: Aller à un témoignage spécifique
      ======================================== */
    
    // Cette fonction permet de "sauter" directement à un témoignage
    // On l'appelle quand l'utilisateur clique sur un dot
    function goToTestimonial(index) {
      // Change l'indice actuel
      currentIndex = index;
      
      // Met à jour l'affichage
      updateCarousel();
    }

    /* ========================================
      EVENT LISTENERS: Boutons de navigation
      ======================================== */
    
    // Quand l'utilisateur clique sur le bouton "Suivant"
    // Appelle la fonction nextTestimonial()
    nextBtn.addEventListener('click', nextTestimonial);
    
    // Quand l'utilisateur clique sur le bouton "Précédent"
    // Appelle la fonction prevTestimonial()
    prevBtn.addEventListener('click', prevTestimonial);

    /* ========================================
      EVENT LISTENERS: Points de pagination
      ======================================== */
    
    // Pour chaque point (dot), ajoute un listener au clic
    dots.forEach((dot, index) => {
      // On appelle goToTestimonial(index) pour aller directement à ce témoignage
      dot.addEventListener('click', () => goToTestimonial(index));
    });

    /* ========================================
      EVENT LISTENERS: Navigation au clavier
      ======================================== */
    
    // Permet de naviguer avec les flèches du clavier
    document.addEventListener('keydown', (e) => {
      // Vérifie qu'on n'est pas en train de taper dans un input
      if (document.activeElement === document.body) {
        // Si l'utilisateur appuie sur la flèche droite → suivant
        if (e.key === 'ArrowRight') nextTestimonial();
        
        // Si l'utilisateur appuie sur la flèche gauche → précédent
        if (e.key === 'ArrowLeft') prevTestimonial();
      }
    });

    /* ========================================
      INITIALISATION
      ======================================== */
    // Au chargement de la page, affiche le premier témoignage (indice 0)
    updateCarousel();
      // Retourne true si l'initialisation a réussi
      return true;
  }

  // ========================================
  // SYSTÈME DE RETRY POUR SPA
  // ========================================
  // Essaie d'initialiser plusieurs fois car le contenu est injecté par Router
  
  let attempts = 0;
  const maxAttempts = 15;
  
  const retryInterval = setInterval(() => {
    if (initTestimonialCarousel()) {
      // Succès! Arrête les tentatives
      clearInterval(retryInterval);
      console.log(' Carousel des témoignages initialisé');
    } else {
      attempts++;
      if (attempts >= maxAttempts) {
        // Abandon après 15 tentatives
        clearInterval(retryInterval);
        console.log(' Carousel des témoignages: impossible d\'initialiser');
      }
    }
  }, 200);  // Essaie toutes les 200ms

  // ========================================
  // RÉINITIALISATION LORS DE LA NAVIGATION SPA
  // ========================================
  // Si l'utilisateur revient à la accueil, réinitialise le carousel
  
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      initTestimonialCarousel();
    }, 100);
  });

});