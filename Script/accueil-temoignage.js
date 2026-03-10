import { API_URL } from './config.js';
/* ===============================
   CAROUSEL DE TÉMOIGNAGES
   Gère la navigation entre 5 avis clients différents
   Utilise Bootstrap Icons pour les étoiles
   =============================== */

export function initAccueilPage() {

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
      stars: 4,
      text: '"Un festin mémorable ! Julie et José ont transformé notre réveillon en un moment magique. Les saveurs étaient tout simplement divines."',
      author: 'Marie D.',
      date: '2024-12-21'
    },
    {
      id: 2,
      stars: 5,
      text: '"Service impeccable et mets délicieux. Notre mariage a été un succès grâce à leur professionnalisme et leur passion pour la cuisine."',
      author: 'Jean P.',
      date: '2024-11-15'
    },
    {
      id: 3,
      stars: 2,
      text: '"Des produits frais, une présentation soignée et un goût incomparable. C\'est exactement ce que nous cherchions pour notre événement."',
      author: 'Sophie M.',
      date: '2024-10-08'
    },
    {
      id: 4,
      stars: 1,
      text: '"Julie et José ont dépassé nos attentes. Leurs menus sur mesure et leur écoute nous ont permis de créer un moment inoubliable."',
      author: 'Luc B.',
      date: '2024-09-22'
    },
    {
      id: 5,
      stars: 5,
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
  const prevBtn = document.querySelectorAll('.temoignages-btn-nav')[0];
  const nextBtn = document.querySelectorAll('.temoignages-btn-nav')[1];
  
  // Les 5 petits points de pagination en bas
  const dots = document.querySelectorAll('.temoignages-dot');

  /* ===============================
    CONFIGURATION API
    =============================== */

  // URL de récupération des avis de l'API Symfony
  const apiAvisclient = `${API_URL}/api/avis`;

  // ========================================
  // VÉRIFICATIONS: Les éléments existent-ils?
  // ========================================
  
  if (!carouselContainer || !prevBtn || !nextBtn || dots.length < 5) {
    console.error('Carousel: éléments DOM introuvables');
    return;
  }

  /* ========================================
    FONCTION: Générer les étoiles avec Bootstrap Icons
    ======================================== */
  
  function generateStars(count) {
    let stars = '';
    
    // Ajoute les étoiles REMPLIES (bi-star-fill)
    for (let i = 0; i < count; i++) {
      stars += '<i class="bi bi-star-fill"></i>';
    }
    
    // Ajoute les étoiles VIDES (bi-star)
    for (let i = count; i < 5; i++) {
      stars += '<i class="bi bi-star"></i>';
    }
    return stars;
  }

  /* ========================================
    FONCTION: Mettre à jour l'affichage
    ======================================== */

  function updateCarousel() {
  
    const currentTestimonial = testimonials[currentIndex];
    
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
    
    // Remplace le contenu par le nouveau HTML
    carouselContainer.innerHTML = testimonialHTML;
    
    // Met à jour les points de pagination
    dots.forEach(dot => {
      dot.classList.remove('active');
    });
    
    dots[currentIndex].classList.add('active');
  }

  /* ========================================
    FONCTION: Aller au témoignage suivant
    ======================================== */
  
  function nextTestimonial() {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateCarousel();
  }

  /* ========================================
    FONCTION: Aller au témoignage précédent
    ======================================== */
  
  function prevTestimonial() {
    currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    updateCarousel();
  }

  /* ========================================
    FONCTION: Aller à un témoignage spécifique
    ======================================== */
  
  function goToTestimonial(index) {
    currentIndex = index;
    updateCarousel();
  }

  /* ========================================
    EVENT LISTENERS: Boutons de navigation
    ======================================== */
  
  nextBtn.addEventListener('click', nextTestimonial);
  prevBtn.addEventListener('click', prevTestimonial);

  /* ========================================
    EVENT LISTENERS: Points de pagination
    ======================================== */
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToTestimonial(index));
  });

  /* ========================================
    EVENT LISTENERS: Navigation au clavier
    ======================================== */
  
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === document.body) {
      if (e.key === 'ArrowRight') nextTestimonial();
      if (e.key === 'ArrowLeft') prevTestimonial();
    }
  });

  /* ========================================
    INITIALISATION
    ======================================== */
  updateCarousel();

}