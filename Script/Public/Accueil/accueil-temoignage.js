import { API_URL } from '../../config.js';
/* ===============================
    CAROUSEL DE TÉMOIGNAGES
      Gère la navigation entre 5 avis clients différents
      Utilise Bootstrap Icons pour les étoiles
   =============================== */

export async function initAccueilPage() {

  /* ===============================
      DONNÉES: Les 5 témoignages
        A voir si on garde ou supprime ces données 
        elle peuvent etre chargé si l'api viens à bugué
        Chaque témoignage contient:
        - id: identifiant unique
        - stars: note de 1 à 5 (nombre d'étoiles remplies)
        - text: le texte du témoignage (entre guillemets)
        - author: nom de l'auteur
        - date: date du témoignage (format YYYY-MM-DD)
     =============================== */
  const testimonials1 = [
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

  /* ===============================
      SÉLECTEURS DOM
     =============================== */
  
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

  // URL de récupération des avis validés de l'API Symfony
  const apiAvisclient = `${API_URL}/api/avis`;

  // Variable debug console : si true, affichage des logs
  let DebugConsole = false;

  // Vérifie que les éléments existent
  if (!carouselContainer || !prevBtn || !nextBtn || dots.length === 0) {
    console.error('Carousel: éléments DOM introuvables');
    return;
  }

  if (DebugConsole) console.log("Script accueil-temoignage chargé !");

  /* ===============================
      VARIABLES DE CONTRÔLE
     =============================== */

  let currentIndex = 0;   // currentIndex = index de quel témoignage on affiche actuellement (0 à 5)
  let testimonials = [];  // Liste des témoignages récupérés depuis l'API

  /* ===============================
      FONCTION: génére les étoiles avec Bootstrap Icons pour le carroussel
        factorisation de fonction 
        si count cas carroussel
        sinon si pour la moyenne
     =============================== */

  function generateStars(count,type)
  {
    let stars = '';
    let fullStars = count;

    if (type !== 'carroussel') {
      // Arrondit la moyenne à l'entier le plus proche
      fullStars = Math.round(count);
    }
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

  /* ===============================
      FONCTION: Mise à jour de l'affichage Carousel
     =============================== */

  function MiseAjourCarousel() {

    if (!testimonials.length) return;

    // Récupération de l'index courant
    const currentTestimonial = testimonials[currentIndex];

    // Création de la carte HTML pour le témoignage
    const testimonialHTML = 
      `
        <div class="temoignages-card">
          <!-- Étoiles du testimonial -->
          <div class="temoignages-card-stars mb-3">
            ${generateStars(currentTestimonial.stars,'carroussel')}
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

    if (DebugConsole) {
      const moyenne = calculmoyenneAvis(testimonials);
      console.log(`Affichage témoignage #${currentIndex + 1}:`, currentTestimonial);
      console.log(`Moyenne des avis : ${moyenne} / 5`);
    }
  }

  /* ===============================
      FONCTION: Mise à jour de l'affichage de la moyenne Globale
     =============================== */

  function MiseAjourMoyenneGlobale(avis) {

    const starsContainer = document.querySelector('.temoignages-stars-global');
    const noteContainer = document.querySelector('.temoignages-note-global');

    if (!starsContainer || !noteContainer) return;

    const moyenne = calculmoyenneAvis(avis);

    starsContainer.innerHTML = generateStars(moyenne,'moyenne');
    noteContainer.textContent = `${moyenne} / 5`;
  }

  /* ===============================
      FONCTION: Aller au témoignage suivant
     =============================== */
  
  function nextTestimonial() {
    currentIndex = (currentIndex + 1) % testimonials.length;
    MiseAjourCarousel();
  }

  /* ========================================
      FONCTION: Aller au témoignage précédent
     ======================================== */
  
  function prevTestimonial() {
    currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    MiseAjourCarousel();
  }

  /* ========================================
      FONCTION: Aller à un témoignage spécifique
     ======================================== */
  
  function goToTestimonial(index) {
    currentIndex = index;
    MiseAjourCarousel();
  }

  /* ========================================
      FONCTION: formatage d'un date en version FR JOUR/MOIS/ANNEE
     ======================================== */

  function formatDateFR(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  /* ========================================
      FONCTION: Fonction pour faire la moyenne des avis sur la page d'acceuil
     ======================================== */
  function calculmoyenneAvis(avis) {
    
    // On Vérifie si le tableau est vide pour le cas de la division par zéro
    if (avis.length === 0) {
      return 0;
    }
    // On stocke la somme des notes
    let total = 0;

    // Parcours tous les avis
    for (let i = 0; i < avis.length; i++) {

      // On récupère la note de l'avis courant et on l'ajoute 
      total += Number(avis[i].stars);
    }

    // On Calcul la moyenne
    const moyenne = total / avis.length;

    // On arrondit à 1 chiffre après la virgule
    return Number(moyenne.toFixed(1));
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
      RÉCUPÉRATION DES DONNÉES VIA L'API
     ======================================== */
  try {
    const response = await fetch(apiAvisclient);
    if (!response.ok) throw new Error(`Impossible de récupérer les avis (status ${response.status})`);

    const data = await response.json();

    // Vérifie la présence des avis
    if (!data?.avis || !Array.isArray(data.avis)) {
      throw new Error('Format de données inattendu depuis l\'API');
    }

    // Transformation des données pour le front
    // Trier par date descendante et garder que les 5 derniers avis 
    testimonials = data.avis
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(avis => ({
        id: avis.id,
        stars: Number(avis.stars) || 5,
        text: avis.text ? avis.text : 'Avis sans texte',
        author: avis.author || 'Anonyme',
        date: avis.date ? formatDateFR(avis.date) : 'Date inconnue'
      }));

    if (DebugConsole) console.log(`Total avis récupérés et triés : ${testimonials.length}`, testimonials);

    // Initialisation du carousel avec le premier témoignage
    MiseAjourCarousel();
    MiseAjourMoyenneGlobale(testimonials);

  } catch (err) {
    console.error('Erreur récupération avis :', err);
    // Affiche un le tableau statique par défaut en cas d'erreur si il y as une érreur API
    testimonials = testimonials1.slice(-5); // les 5 derniers
    if (DebugConsole){
      console.log('Utilisation des avis statiques :', testimonials);
    }
    /* ========================================
        INITIALISATION ET MISE A JOUR
       ======================================== */
    MiseAjourCarousel();
  }
  
 
}