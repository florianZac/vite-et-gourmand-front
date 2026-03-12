import { API_URL } from '../config.js';
export function initNosMenuPage() {

  /* ===============================
   SCRIPT PAGE NOS MENUS
   Gère :
   1. Le chargement des menus depuis l'API via AJAX (GET)
   2. La génération dynamique des cards dans la grille
   3. La génération dynamique des badges Thème et Régime depuis les données API
   4. Le filtrage en temps réel (recherche, thème, régime, prix, personnes)
   5. Le compteur "X menus trouvés"
   6. La réinitialisation des filtres
   =============================== */

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de base de l'API Symfony
  const apiReturnMenus = `${API_URL}/api/menus`;

  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // Grille où les cards seront injectées
  const menuGrid = document.getElementById('menu-grid');

  // Compteur "X menus trouvés"
  const menuCount = document.getElementById('menu-count');

  // Champ de recherche texte
  const filterSearch = document.getElementById('filter-search');

  // Conteneurs des badges dynamiques (thème et régime)
  const filterThemes = document.getElementById('filter-themes');
  const filterRegimes = document.getElementById('filter-regimes');

  // Slider du prix max
  const filterPrice = document.getElementById('filter-price');
  const filterPriceValue = document.getElementById('filter-price-value');

  // Input nombre de personnes
  const filterPersons = document.getElementById('filter-persons');

  // Bouton réinitialiser
  const btnReset = document.getElementById('btn-reset-filters');

  /* ===============================
     VARIABLES GLOBALES
     =============================== */

  // Stocke TOUS les menus reçus de l'API (non filtrés)
  // Ce tableau ne change jamais après le chargement initial
  let allMenus = [];

  // Stocke le thème actuellement sélectionné ("Tous" par défaut)
  let selectedTheme = 'Tous';

  // Stocke le régime actuellement sélectionné ("Tous" par défaut)
  let selectedRegime = 'Tous';

  /* ===============================
     FONCTION : CHARGER LES MENUS DEPUIS L'API (AJAX)
     - Appelle GET /api/menus
     - Stocke les données dans allMenus
     - Génère les badges thème/régime dynamiquement
     - Affiche toutes les cards
     =============================== */

  async function loadMenus() {
    try {
      // Requête GET vers l'API pour récupérer tous les menus
      const response = await fetch(`${BASE_URL}/menus`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Si la réponse n'est pas OK (404, 500, etc.)
      if (!response.ok) {
        console.error('Erreur chargement menus:', response.status);
        return;
      }

      // Parse la réponse JSON
      const data = await response.json();

      // Stocke tous les menus dans la variable globale
      // Adapte selon la structure de ta réponse API :
      // Si l'API retourne directement un tableau → data
      // Si l'API retourne { "hydra:member": [...] } → data["hydra:member"]
      allMenus = data['hydra:member'] || data;

      console.log('✓ Menus chargés:', allMenus.length);

      // Génère les badges thème et régime depuis les données reçues
      generateThemeBadges();
      generateRegimeBadges();

      // Met à jour le slider prix max avec le prix le plus élevé
      updatePriceSliderMax();

      // Affiche toutes les cards (aucun filtre actif au début)
      applyFilters();

    } catch (err) {
      console.error('Erreur réseau chargement menus:', err);
    }
  }

  /* ===============================
     FONCTION : GÉNÉRER LES BADGES THÈME DYNAMIQUEMENT
     - Parcourt tous les menus pour extraire les thèmes uniques
     - Crée un badge "Tous" + un badge par thème trouvé
     - "Tous" est actif par défaut
     =============================== */

  function generateThemeBadges() {
    if (!filterThemes) return;

    // Extrait tous les thèmes uniques depuis les menus
    // Set() élimine les doublons automatiquement
    const themes = [...new Set(allMenus.map(menu => menu.theme).filter(Boolean))];

    // Vide le conteneur avant de régénérer
    filterThemes.innerHTML = '';

    // Crée le badge "Tous" (actif par défaut)
    const btnAll = document.createElement('button');
    btnAll.className = 'nos_menu-badge active';
    btnAll.textContent = 'Tous';
    btnAll.addEventListener('click', () => {
      selectedTheme = 'Tous';
      // Met à jour les badges actifs visuellement
      updateBadgesActive(filterThemes, btnAll);
      // Relance le filtrage
      applyFilters();
    });
    filterThemes.appendChild(btnAll);

    // Crée un badge pour chaque thème unique
    themes.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'nos_menu-badge';
      btn.textContent = theme;
      btn.addEventListener('click', () => {
        selectedTheme = theme;
        updateBadgesActive(filterThemes, btn);
        applyFilters();
      });
      filterThemes.appendChild(btn);
    });
  }

  /* ===============================
     FONCTION : GÉNÉRER LES BADGES RÉGIME DYNAMIQUEMENT
     - Même logique que pour les thèmes
     - Parcourt tous les menus pour extraire les régimes uniques
     =============================== */

  function generateRegimeBadges() {
    if (!filterRegimes) return;

    // Extrait tous les régimes uniques
    const regimes = [...new Set(allMenus.map(menu => menu.regime).filter(Boolean))];

    // Vide le conteneur
    filterRegimes.innerHTML = '';

    // Badge "Tous" (actif par défaut)
    const btnAll = document.createElement('button');
    btnAll.className = 'nos_menu-badge active';
    btnAll.textContent = 'Tous';
    btnAll.addEventListener('click', () => {
      selectedRegime = 'Tous';
      updateBadgesActive(filterRegimes, btnAll);
      applyFilters();
    });
    filterRegimes.appendChild(btnAll);

    // Un badge par régime unique
    regimes.forEach(regime => {
      const btn = document.createElement('button');
      btn.className = 'nos_menu-badge';
      btn.textContent = regime;
      btn.addEventListener('click', () => {
        selectedRegime = regime;
        updateBadgesActive(filterRegimes, btn);
        applyFilters();
      });
      filterRegimes.appendChild(btn);
    });
  }

  /* ===============================
     FONCTION : METTRE À JOUR LE BADGE ACTIF
     - Retire la classe "active" de tous les badges du conteneur
     - Ajoute la classe "active" uniquement sur le badge cliqué
     =============================== */

  function updateBadgesActive(container, activeBtn) {
    // Retire "active" de tous les badges du conteneur
    container.querySelectorAll('.nos_menu-badge').forEach(badge => {
      badge.classList.remove('active');
    });
    // Ajoute "active" sur le badge cliqué
    activeBtn.classList.add('active');
  }

  /* ===============================
     FONCTION : METTRE À JOUR LE SLIDER PRIX MAX
     - Trouve le prix le plus élevé parmi tous les menus
     - Configure le max du slider avec cette valeur
     - Positionne le slider au maximum par défaut
     =============================== */

  function updatePriceSliderMax() {
    if (!filterPrice) return;

    // Trouve le prix max parmi tous les menus
    const maxPrice = Math.max(...allMenus.map(menu => menu.price || 0));

    // Configure le slider
    filterPrice.max = maxPrice;
    filterPrice.value = maxPrice;

    // Met à jour l'affichage du prix
    if (filterPriceValue) filterPriceValue.textContent = `${maxPrice} €`;

    // Met à jour le label max sous le slider
    const maxLabel = document.getElementById('filter-price-max-label');
    if (maxLabel) maxLabel.textContent = `${maxPrice}€`;
  }

  /* ===============================
     FONCTION : APPLIQUER TOUS LES FILTRES
     - Filtre le tableau allMenus selon TOUS les critères actifs
     - Chaque filtre réduit progressivement la liste
     - Met à jour le compteur et réaffiche les cards
     =============================== */

  function applyFilters() {
    // Récupère les valeurs actuelles de chaque filtre
    const searchText = filterSearch?.value?.toLowerCase().trim() || '';
    const maxPrice = parseFloat(filterPrice?.value) || Infinity;
    const minPersons = parseInt(filterPersons?.value) || 0;

    // Filtre le tableau allMenus
    const filtered = allMenus.filter(menu => {

      // FILTRE 1 : Recherche texte
      // Cherche dans le nom, le thème, le régime, et les allergènes/ingrédients
      if (searchText) {
        const name = (menu.name || '').toLowerCase();
        const theme = (menu.theme || '').toLowerCase();
        const regime = (menu.regime || '').toLowerCase();
        // Les tags peuvent être un tableau de strings (allergènes, ingrédients)
        const tags = (menu.tags || []).join(' ').toLowerCase();

        // Si aucun champ ne contient le texte recherché → on exclut ce menu
        const matchSearch = name.includes(searchText)
          || theme.includes(searchText)
          || regime.includes(searchText)
          || tags.includes(searchText);

        if (!matchSearch) return false;
      }

      // FILTRE 2 : Thème
      // Si "Tous" est sélectionné, on ne filtre pas sur le thème
      if (selectedTheme !== 'Tous') {
        if (menu.theme !== selectedTheme) return false;
      }

      // FILTRE 3 : Régime
      // Même logique que le thème
      if (selectedRegime !== 'Tous') {
        if (menu.regime !== selectedRegime) return false;
      }

      // FILTRE 4 : Prix max / personne
      // On garde uniquement les menus dont le prix est ≤ au slider
      if (menu.price > maxPrice) return false;

      // FILTRE 5 : Nombre minimum de personnes
      // Si le champ est rempli, on garde les menus dont le min de personnes
      // est ≤ à la valeur saisie (pour que le client puisse commander pour ce nombre)
      if (minPersons > 0) {
        if ((menu.minPersons || 0) > minPersons) return false;
      }

      // Si tous les filtres passent → on garde ce menu
      return true;
    });

    // Met à jour le compteur "X menus trouvés"
    if (menuCount) {
      menuCount.textContent = `${filtered.length} menu${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`;
    }

    // Affiche les cards filtrées dans la grille
    renderCards(filtered);
  }

  /* ===============================
     FONCTION : AFFICHER LES CARDS DANS LA GRILLE
     - Vide la grille
     - Crée une card HTML pour chaque menu du tableau filtré
     - Injecte les cards dans le DOM
     =============================== */

  function renderCards(menus) {
    if (!menuGrid) return;

    // Vide la grille avant de réinjecter
    menuGrid.innerHTML = '';

    // Si aucun menu ne correspond aux filtres
    if (menus.length === 0) {
      menuGrid.innerHTML = '<p class="text-center text-muted">Aucun menu ne correspond à vos critères.</p>';
      return;
    }

    // Crée une card pour chaque menu
    menus.forEach(menu => {
      const card = document.createElement('div');
      card.className = 'nos_menu-card';

      // Génère le HTML des tags (allergènes/ingrédients)
      const tagsHtml = (menu.tags || [])
        .map(tag => `<span class="nos_menu-card-tag">${tag}</span>`)
        .join('');

      // Construit le HTML complet de la card
      card.innerHTML = `
        <!-- Image du menu avec badges thème/régime -->
        <div class="nos_menu-card-img">
          <img src="${menu.image || '/Assets/Images/placeholder-menu.jpg'}" alt="${menu.name || 'Menu'}">
          <div class="nos_menu-card-badges">
            ${menu.theme ? `<span class="nos_menu-card-badge-theme">${menu.theme}</span>` : ''}
            ${menu.regime ? `<span class="nos_menu-card-badge-regime">${menu.regime}</span>` : ''}
          </div>
        </div>

        <!-- Contenu de la card -->
        <div class="nos_menu-card-body">
          <!-- Titre du menu -->
          <h3 class="nos_menu-card-title">${menu.name || 'Sans titre'}</h3>

          <!-- Description courte (limitée à 3 lignes via CSS) -->
          <p class="nos_menu-card-description">${menu.description || ''}</p>

          <!-- Tags (allergènes / ingrédients principaux) -->
          <div class="nos_menu-card-tags">
            ${tagsHtml}
          </div>

          <!-- Pied de card : prix + nb personnes + bouton détail -->
          <div class="nos_menu-card-footer">
            <div>
              <div class="nos_menu-card-price">
                ${menu.price || 0} € <span>/pers.</span>
              </div>
              <div class="nos_menu-card-persons">
                <i class="bi bi-people"></i> min. ${menu.minPersons || 1} personnes
              </div>
            </div>
            <a href="/menu/${menu.id}" class="btn btn-nos_menu-detail">
              Voir le détail
            </a>
          </div>
        </div>
      `;

      // Ajoute la card à la grille
      menuGrid.appendChild(card);
    });
  }

  /* ===============================
     FONCTION : RÉINITIALISER TOUS LES FILTRES
     - Vide la recherche
     - Remet "Tous" actif pour thème et régime
     - Remet le slider prix au max
     - Vide le nombre de personnes
     - Relance le filtrage
     =============================== */

  function resetFilters() {
    // Vide le champ recherche
    if (filterSearch) filterSearch.value = '';

    // Remet "Tous" actif pour le thème
    selectedTheme = 'Tous';
    if (filterThemes) {
      const firstBadge = filterThemes.querySelector('.nos_menu-badge');
      if (firstBadge) updateBadgesActive(filterThemes, firstBadge);
    }

    // Remet "Tous" actif pour le régime
    selectedRegime = 'Tous';
    if (filterRegimes) {
      const firstBadge = filterRegimes.querySelector('.nos_menu-badge');
      if (firstBadge) updateBadgesActive(filterRegimes, firstBadge);
    }

    // Remet le slider prix au maximum
    if (filterPrice) {
      filterPrice.value = filterPrice.max;
      if (filterPriceValue) filterPriceValue.textContent = `${filterPrice.max} €`;
    }

    // Vide le nombre de personnes
    if (filterPersons) filterPersons.value = '';

    // Relance le filtrage (affiche tous les menus)
    applyFilters();

    console.log('✓ Filtres réinitialisés');
  }

  /* ===============================
     LISTENERS : FILTRES EN TEMPS RÉEL
     - Chaque modification d'un filtre relance applyFilters()
     - Pas besoin de bouton "Rechercher", tout est instantané
     =============================== */

  // Recherche texte : filtre à chaque frappe
  if (filterSearch) {
    filterSearch.addEventListener('input', applyFilters);
  }

  // Slider prix : filtre à chaque déplacement + met à jour l'affichage
  if (filterPrice) {
    filterPrice.addEventListener('input', () => {
      // Met à jour le texte "Prix max : XX €"
      if (filterPriceValue) filterPriceValue.textContent = `${filterPrice.value} €`;
      // Relance le filtrage
      applyFilters();
    });
  }

  // Nombre de personnes : filtre à chaque saisie
  if (filterPersons) {
    filterPersons.addEventListener('input', applyFilters);
  }

  // Bouton réinitialiser
  if (btnReset) {
    btnReset.addEventListener('click', resetFilters);
  }

  /* ===============================
     INITIALISATION
     - Charge les menus depuis l'API au chargement de la page
     =============================== */

  loadMenus();
}