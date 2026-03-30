import { API_URL } from '../config.js';
import {sanitizeInput, sanitizeHtml } from '../script.js';
console.log("=== nos_menus.js chargé ===");
export function initNosMenusPage() {

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

  // Variable debug console
  let DebugConsole = true;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des mennus
  const apiMenusUrl = `${API_URL}/api/menus/full`;

  // EndPoint de l'API pour la récupération des allergènes
  const apiAllergenesUrl = `${API_URL}/api/allergenes`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API NOS MENUS ===");
    console.log("API_URL :", API_URL);
    console.log("apiMenusUrl :", apiMenusUrl);
    console.log("apiAllergenesUrl :", apiAllergenesUrl);   
    console.log("==================================");
  }
  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // Grille où les cards seront injectées
  const menuGrid = document.getElementById('menu-grid');

  // Compteur "X menus trouvés"
  const menuCount = document.getElementById('menu-count');

  // Champ de recherche texte
  const filterSearch = document.getElementById('filter-search');

  // Conteneurs des badges dynamiques (thème et régime et disponible)
  const filterThemes = document.getElementById('filter-themes');
  const filterRegimes = document.getElementById('filter-regimes');
  const filterDisponibilite = document.getElementById('filter-disponibilite');
  // Slider du prix max
  const filterPrice = document.getElementById('filter-price');
  const filterPriceValue = document.getElementById('filter-price-value');

  // Filtre des allergènes
  const filterAllergenes = document.getElementById('filter-allergenes');

  // Input nombre de personnes
  const filterPersons = document.getElementById('filter-persons');

  // Bouton réinitialiser
  const btnReset = document.getElementById('btn-reset-filters');

  if (DebugConsole) {
    console.log("[DOM] Éléments trouvés :", {
      menuGrid: Boolean(menuGrid),
      menuCount: Boolean(menuCount),
      filterSearch: Boolean(filterSearch),
      filterThemes: Boolean(filterThemes),
      filterRegimes: Boolean(filterRegimes),
      filterPrice: Boolean(filterPrice),
      filterPersons: Boolean(filterPersons),
      btnReset: Boolean(btnReset),
    });
  }

  /* ===============================
      VARIABLES GLOBALES
     =============================== */

  // Stocke TOUS les menus reçus de l'API (non filtrés)
  let allMenus = [];

  // Stocke le thème actuellement sélectionné ("Tous" par défaut)
  let selectedTheme = 'Tous';

  // Stocke le régime actuellement sélectionné ("Tous" par défaut)
  let selectedRegime = 'Tous';

  // Stocke le statut disponible indisponible sélectionné ("Tous" par défaut)
  let selectedDisponibilite = 'Tous';

  // Tableau des allergènes à exclure 
  let selectedAllergenes = [];

  /* ===============================
      FONCTIONS UTILITAIRES
        - Extraient le libellé texte depuis les objets theme/regime retournés par l'API
     =============================== */

  // Retourne le libellé du thème
  function getThemeLabel(menu) {
    if (menu.theme) {
      if (menu.theme.titre) {
        if (DebugConsole) console.log(`[getThemeLabel] Menu "${menu.titre || 'Sans titre'}" - Thème trouvé :`, menu.theme.titre);
        return menu.theme.titre;
      } else {
        if (DebugConsole) console.warn(`[getThemeLabel] Menu "${menu.titre || 'Sans titre'}" - Thème défini mais titre manquant`);
        return '';
      }
    } else {
      if (DebugConsole) console.log(`[getThemeLabel] Menu "${menu.titre || 'Sans titre'}" - Aucun thème`);
      return '';
    }
  }

  // Retourne le libellé du régime
  function getRegimeLabel(menu) {
    if (!menu.regime) {
      if (DebugConsole) console.log(`[getRegimeLabel] Menu "${menu.titre || 'Sans titre'}" - Aucun régime`);
      return '';
    }
    if (menu.regime.libelle) {
      if (DebugConsole) console.log(`[getRegimeLabel] Menu "${menu.titre || 'Sans titre'}" - Régime trouvé :`, menu.regime.libelle);
      return menu.regime.libelle;
    }
    if (DebugConsole) console.warn(`[getRegimeLabel] Menu "${menu.titre || 'Sans titre'}" - Régime défini mais libelle manquant`);
    return '';
  }

  // Retourne un tableau de noms de plats
  function getPlatNames(menu) {
    if (menu.plats && Array.isArray(menu.plats)) {
      var result = [];
      for (var i = 0; i < menu.plats.length; i++) {
        var plat = menu.plats[i];

        if (plat.titre) {
          if (DebugConsole) console.log(`[getPlatNames] Menu "${menu.titre || 'Sans titre'}" - Plat ${i} :`, plat.titre);
          result.push(plat.titre);
        } else {
          if (DebugConsole) console.warn(`[getPlatNames] Menu "${menu.titre || 'Sans titre'}" - Plat ${i} sans titre`);
          result.push('');
        }
      }
      return result;
    } else {
      if (DebugConsole) console.log(`[getPlatNames] Menu "${menu.titre || 'Sans titre'}" - Aucun plat ou format invalide`);
      return [];
    }
  }

  // Retourne la première photo de plat trouvée
  function getMenuImage(menu) {
    if (!menu.plats || !Array.isArray(menu.plats)) {
      if (DebugConsole) console.log(`[getMenuImage] Menu "${menu.titre || 'Sans titre'}" - Aucun plat ou format invalide, utilisation placeholder`);
      return '/Assets/Images/placeholder-menu.jpg';
    }

    var image = '/Assets/Images/placeholder-menu.jpg';
    for (var i = 0; i < menu.plats.length; i++) {
      if (menu.plats[i].photo) {
        image = menu.plats[i].photo;
        if (DebugConsole) console.log(`[getMenuImage] Menu "${menu.titre || 'Sans titre'}" - Photo trouvée au plat ${i} :`, image);
        break;
      }
    }

    if (DebugConsole && image === '/Assets/Images/placeholder-menu.jpg') {
      console.log(`[getMenuImage] Menu "${menu.titre || 'Sans titre'}" - Aucun plat avec photo, utilisation placeholder`);
    }
    return image;
  }

  /* ===============================
      FONCTION : CHARGER LES MENUS DEPUIS L'API (AJAX)
        - Appelle GET /api/menus
        - Stocke les données dans allMenus
        - Génère les badges thème/régime dynamiquement
        - Affiche toutes les cards
     =============================== */

  async function loadMenus() {
    if (DebugConsole) console.log("[loadMenus] Début - Appel GET", apiMenusUrl);

    try {
      // Requête GET vers l'API pour récupérer tous les menus
      const response = await fetch(apiMenusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (DebugConsole) console.log("[loadMenus] Réponse status :", response.status);

      if (!response.ok) {
        console.error('[loadMenus] Erreur chargement menus:', response.status);
        if (menuGrid) {
          menuGrid.innerHTML = '<p class="text-center text-muted">Erreur lors du chargement des menus.</p>';
        }
        return;
      }

      // Parse la réponse JSON
      let data = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (DebugConsole) {
        console.log("[DEBUG API]", data);
        console.log("[DEBUG allMenus]", allMenus);
      }
      // Stocke tous les menus dans la variable globale
      allMenus = data.menus || [];

      if (DebugConsole) {
        console.log("[loadMenus] Données reçues :", data);
        console.log("[loadMenus] Nombre de menus :", allMenus.length);
        allMenus.forEach((m, i) => console.log(`[loadMenus] Menu ${i} :`, m.titre, "- Thème:", getThemeLabel(m), "- Régime:", getRegimeLabel(m)));
      }

      // Génère les badges thème et régime et disponible  depuis les données reçues
      generateThemeBadges();
      generateRegimeBadges();
      generateDisponibiliteBadges();

      // Gènere le badges allergènes
      generateAllergeneBadges();
      // Met à jour le slider prix max avec le prix le plus élevé
      updatePriceSliderMax();

      // Affiche toutes les cards (aucun filtre actif au début)
      applyFilters();

    } catch (err) {
      console.error("[loadMenus] Erreur réseau :", err);
      if (menuGrid) {
        menuGrid.innerHTML = '<p class="text-center text-muted">Erreur réseau, veuillez réessayer.</p>';
      }
    }
  }

  /* ===============================
      FONCTION : GÉNÉRER LES BADGES THÈME DYNAMIQUEMENT
        - Parcourt tous les menus pour extraire les thèmes uniques
        - Crée un badge "Tous" + un badge par thème trouvé
        - "Tous" est actif par défaut
     =============================== */
  function generateDisponibiliteBadges() {
    
    // Badge filtre disponible
    if (!filterDisponibilite) return;

    // Vide le conteneur avant de régénérer
    filterDisponibilite.innerHTML = '';

    // Crée le badge "Tous" (actif par défaut)
    const btnAll = document.createElement('button');
    btnAll.className = 'nos_menu-badge active';
    btnAll.textContent = 'Tous';
    btnAll.addEventListener('click', () => {
      selectedDisponibilite = 'Tous';
      // Met à jour les badges actifs visuellement
      updateBadgesActive(filterDisponibilite, btnAll);
      // Relance le filtrage
      applyFilters();
    });
    filterDisponibilite.appendChild(btnAll);

    // Disponible
    const btnDisponible = document.createElement('button');
    btnDisponible.className = 'nos_menu-badge';
    btnDisponible.textContent = 'Disponible';
    btnDisponible.addEventListener('click', () => {
      selectedDisponibilite = 'Disponible';
      // Met à jour les badges actifs visuellement
      updateBadgesActive(filterDisponibilite, btnDisponible);
      // Relance le filtrage
      applyFilters();
    });
    filterDisponibilite.appendChild(btnDisponible);
  }
  
  // Badge filtre thèmes
  function generateThemeBadges() {
    if (!filterThemes) return;

    // Extrait tous les thèmes uniques depuis les menus
    // Set() élimine les doublons automatiquement
    const themes = [...new Set(allMenus.map(menu => getThemeLabel(menu)).filter(Boolean))];

    if (DebugConsole) console.log("[generateThemeBadges] Thèmes trouvés :", themes);

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
      if (DebugConsole) console.log("[generateThemeBadges] Création badge thème :", theme);
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
      FONCTION : GÉNÉRER LES BADGES TAG DYNAMIQUEMENT
        - Parcourt tous les menus pour extraire les tags uniques
    =============================== */
  function generateTagBadges(menu) {
    if (!menu.tags || menu.tags.length === 0) return '';

    let tagsHtml = '';
    for (let i = 0; i < menu.tags.length; i++) {
      const tag = menu.tags[i];
      if (tag && tag.tag) {
        tagsHtml += `<span class="nos_menu-card-tag">${tag.tag}</span>`;
      }
    }
    if (DebugConsole) console.log("[generateTagBadges] Tags trouvés :", tagsHtml);
    return tagsHtml;
  }

  /* ===============================
      FONCTION : GÉNÉRER LES BADGES DISPONIBLE/INDISPONIBLE DYNAMIQUEMENT
        - récupère la quantité restante si inférieur à 1 indisponible sinon disponible
    =============================== */
  function generateDisponibiliteBadge(menu) {
    // Vérifie que le menu existe et que quantite_restante est un nombre
    if (!menu || typeof menu.quantite_restante !== 'number') {
      return '';
    }
    let badgeDispoHtml = '';
    // Si la quantité restante est suffisante pour le nombre de personnes minimum  disponible
    if (menu.quantite_restante >= menu.nombre_personne_minimum) {
      badgeDispoHtml = '<span class="nos_menu-card-badge-dispo">Disponible</span>';
    } else {
      badgeDispoHtml = '<span class="nos_menu-card-badge-nondispo">Indisponible</span>';
    }

    if (DebugConsole) {
      console.log(`[generateDisponibiliteBadge] Menu "${menu.titre || 'Sans titre'}" - quantite_restante: ${menu.quantite_restante}, nombre_personne_minimum: ${menu.nombre_personne_minimum} => ${badgeDispoHtml}`);
    }
    return badgeDispoHtml;
  }

  /* ===============================
      FONCTION : GÉNÉRER LES BADGES RÉGIME DYNAMIQUEMENT
        - Même logique que pour les thèmes
        - Parcourt tous les menus pour extraire les régimes uniques
     =============================== */

  function generateRegimeBadges() {
    if (!filterRegimes) return;

    // Extrait tous les libellés de régimes uniques
    var regimes = [];
    for (var i = 0; i < allMenus.length; i++) {
      var label = getRegimeLabel(allMenus[i]);
      if (label) {
        if (regimes.indexOf(label) === -1) {
          regimes.push(label);
        }
      }
    }
    if (DebugConsole) console.log("[generateRegimeBadges] Régimes trouvés :", regimes);

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
      if (DebugConsole) console.log("[generateRegimeBadges] Création badge régime :", regime);
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
        - 1. Retire la classe "active" de tous les badges du conteneur
        - 2. Ajoute la classe "active" uniquement sur le badge cliqué
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
        - 1. Trouve le prix le plus élevé parmi tous les menus
        - 2. Configure le max du slider avec cette valeur
        - 3. Positionne le slider au maximum par défaut
     =============================== */

  function updatePriceSliderMax() {
    if (!filterPrice) return;

    // Trouve le prix max parmi tous les menus
    var maxPrice = 0;
    for (var i = 0; i < allMenus.length; i++) {
      var prix = allMenus[i].prix_par_personne;
      if (!prix) {
        prix = 0;
      }
      if (prix > maxPrice) {
        maxPrice = prix;
      }
    }
    if (DebugConsole) console.log("[updatePriceSliderMax] Prix max trouvé :", maxPrice);

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
        - 1. Filtre le tableau allMenus selon TOUS les critères actifs
        - 2. Chaque filtre réduit progressivement la liste
        - 3. Met à jour le compteur et réaffiche les cards
     =============================== */
  function applyFilters() {
    // Récupère les valeurs actuelles de chaque filtre
    var searchText = '';

    if (filterSearch && filterSearch.value) {
      searchText = filterSearch.value.toLowerCase();
      searchText = searchText.trim();
    }

    var maxPrice = Infinity;

    if (filterPrice && filterPrice.value) {
      var price = parseFloat(filterPrice.value);

      if (!isNaN(price)) {
        maxPrice = price;
      }
    }

    var minPersons = 0;

    if (filterPersons && filterPersons.value) {
      var persons = parseInt(filterPersons.value);

      if (!isNaN(persons)) {
        minPersons = persons;
      }
    }

    if (DebugConsole) {
      console.log("[applyFilters] Filtres actifs :", {
        searchText,
        selectedTheme,
        selectedRegime,
        maxPrice,
        minPersons
      });
      console.log("[applyFilters] allMenus avant filtrage :", allMenus.map(m => m.titre));
    }
    // Filtre le tableau allMenus
    const filtered = allMenus.filter(menu => {

      // FILTRE 1 : Recherche texte
      // Cherche dans le nom, le thème, le régime, et les allergènes/ingrédients
      if (searchText) {
        const titre = (menu.titre || '').toLowerCase();
        const theme = getThemeLabel(menu).toLowerCase();
        const regime = getRegimeLabel(menu).toLowerCase();
        const description = (menu.description || '').toLowerCase();
        const plats = getPlatNames(menu).join(' ').toLowerCase();
        // Les tags peuvent être un tableau de strings (allergènes, ingrédients)
        //const tags = (menu.tags || []).join(' ').toLowerCase();
        const tags = (menu.tags || [])
          .map(t => t.tag || '')
          .join(' ')
          .toLowerCase();

        // Si aucun champ ne contient le texte recherché on exclut ce menu
        const matchSearch = titre.includes(searchText)
          || theme.includes(searchText)
          || regime.includes(searchText)
          || description.includes(searchText)
          || plats.includes(searchText)
          || tags.includes(searchText);

        if (!matchSearch) return false;
      }

      // FILTRE 2 : Compare et affiche avec le libellé du Thème 
      // Si "Tous" est sélectionné, on ne filtre pas sur le thème
      if (selectedTheme !== 'Tous') {
        if (getThemeLabel(menu) !== selectedTheme) return false;
      }

      // FILTRE 3 :
      // Même logique que le thème
      if (selectedRegime !== 'Tous') {
        if (getRegimeLabel(menu) !== selectedRegime) return false;
      }

      // FILTRE 4 : Prix max / personne
      // Garde uniquement les menus dont le prix est ≤ au slider
      if (menu.prix_par_personne > maxPrice) return false;

      // FILTRE 5 : Nombre minimum de personnes
      // Si le champ est rempli, on garde les menus dont le min de personnes
      // Garde les menus dont le minimum est est ≤ à la valeur saisie 
      if (minPersons > 0) {
        if ((menu.nombre_personne_minimum || 0) > minPersons) return false;
      }

      // FILTRE 6 : Disponibilité
      if (selectedDisponibilite === 'Disponible') {
        if (menu.quantite_restante < menu.nombre_personne_minimum) {
          return false;
        }
      }

      // FILTRE 7 : Exclusion des allergènes sélectionnés
      if (selectedAllergenes.length > 0) {

        // Récupère tous les allergènes du menu
        let menuAllergenes = [];

        const plats = menu.plats || [];
        plats.forEach(plat => {
          const allergenes = plat.allergenes || [];
          allergenes.forEach(a => {
            if (a.id) {
              menuAllergenes.push(a.id);
            }
          });
        });

        // Vérifie s'il y a un allergène interdit dans le menu
        const hasForbidden = selectedAllergenes.some(aId =>
          menuAllergenes.includes(aId)
        );

        // Si oui on exclut le menu
        if (hasForbidden) return false;
      }

      if (DebugConsole) {
        console.log("[FILTRE ALLERGENES]", {
          selectedAllergenes,
          menu: menu.titre,
          menuAllergenes
        });
      }

      // Si tous les filtres passent on garde ce menu
      return true;
    });

    if (DebugConsole) console.log("[applyFilters] Menus filtrés :", filtered.map(m => m.titre));


    // Met à jour le compteur "X menus trouvés"
    if (menuCount) {
      menuCount.textContent = `${filtered.length} menu${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`;
    }

    // Affiche les cards filtrées dans la grille
    renderCards(filtered);
  }

  /* ===============================
      FONCTION : AFFICHER LES CARDS DANS LA GRILLE
        - 1. Vide la grille
        - 2. Crée une card HTML pour chaque menu du tableau filtré
        - 3. Injecte les cards dans le DOM
        - 4. Image du premier plat avec badges thème + régime + dispo
          - 4.1 Titre, description (3 lignes max)
          - 4.2 Tags (noms des plats : Foie gras, Magret, Truffe...)
          - 4.3 Prix/pers + nb min personnes + bouton "Voir le détail"
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

      // Récupère les libellés
      const themeLabel = getThemeLabel(menu);
      const regimeLabel = getRegimeLabel(menu);
      let tagsHtml = '';
      if (menu.tags && Array.isArray(menu.tags)) {
        tagsHtml = menu.tags
          .map(tag => `<span class="nos_menu-card-tag">${tag.tag}</span>`)
          .join('');
      }

      // Badge de disponibilité
      const dispoBadgeHtml = generateDisponibiliteBadge(menu);

      // Image du menu : première photo de plat trouvée ou fallback
      const imageUrl = getMenuImage(menu);

      if (DebugConsole) {
        if (imageUrl.includes('placeholder')) console.warn(`[renderCards] Menu "${sanitizeHtml(menu.titre)}" sans photo, placeholder utilisé`);
        console.log(`[renderCards] Menu "${menu.titre}" - Thème: ${themeLabel}, Régime: ${regimeLabel}, Dispo: ${dispoBadgeHtml}, Plats: ${getPlatNames(menu).length}`);
      }
      // Construit le HTML complet de la card
      card.innerHTML = `
        <!-- Image du menu avec badges thème/régime/dispo -->
        <div class="nos_menu-card-img">
          <img src="${imageUrl}" alt="${sanitizeHtml(menu.titre) || 'Menu'}">
          <div class="nos_menu-card-badges">
            <div class="left-badges">
              ${sanitizeHtml(themeLabel) ? `<span class="nos_menu-card-badge-theme">${sanitizeHtml(themeLabel)}</span>` : ''}
            </div>
            <div class="center-badges">
              ${(dispoBadgeHtml)}
            </div>
            <div class="right-badges">
              ${sanitizeHtml(regimeLabel) ? `<span class="nos_menu-card-badge-regime">${sanitizeHtml(regimeLabel)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Contenu de la card -->
        <div class="nos_menu-card-body">
          <!-- Titre du menu -->
          <h3 class="nos_menu-card-title">${sanitizeHtml(menu.titre) || 'Sans titre'}</h3>

          <!-- Description courte -->
          <p class="nos_menu-card-description">${sanitizeHtml(menu.description) || ''}</p>

          <!-- Tags (noms des plats du menu) -->
          <div class="nos_menu-card-tags">
            ${generateTagBadges(menu)}
          </div>
          <div class="nos_menu-card-divider"></div>
          <!-- Pied de card : prix + nb personnes + bouton détail -->
          <div class="nos_menu-card-footer">
            <div>
              <div class="nos_menu-card-price">
                ${menu.prix_par_personne || 0} € <span>/pers.</span>
              </div>
              <div class="nos_menu-card-persons">
                <i class="bi bi-people"></i> min. ${menu.nombre_personne_minimum || 1} personnes
              </div>
            </div>
            <a href="/detail_menu?id=${menu.id}" class="btn btn-nos_menu-detail">
              Voir le détail
            </a>
          </div>
        </div>
      `;

      // Ajoute la card à la grille
      menuGrid.appendChild(card);
    });

    if (DebugConsole) console.log("[renderCards] Cards injectées :", menus.length);
  }

  /* ===============================
      FONCTIONS : GENERATION DES BADGES ALLERGÈNES
     =============================== */
  function generateAllergeneBadges() {
    if (!filterAllergenes) return;
    filterAllergenes.innerHTML = '';

    // Extraction de tous les allergènes depuis les plats des menus
    const allergenesMap = {};
    allMenus.forEach(function(menu) {
      const plats = menu.plats || [];
      plats.forEach(function(plat) {
        const allergenes = plat.allergenes || [];
        allergenes.forEach(function(a) {
          if (a.id && !allergenesMap[a.id]) {
            allergenesMap[a.id] = a.libelle;
          }
        });
      });
    });

    if (DebugConsole) console.log("[generateAllergeneBadges] Allergènes trouvés :", allergenesMap);

    // Crée un badge par allergène
    Object.keys(allergenesMap).forEach(function(id) {
      const badge = document.createElement('button');
      badge.className = 'nos_menu-badge';
      badge.textContent = allergenesMap[id];
      badge.dataset.id = id;

      badge.addEventListener('click', function() {
        const allergenId = parseInt(badge.dataset.id);
        if (selectedAllergenes.includes(allergenId)) {
          selectedAllergenes = selectedAllergenes.filter(x => x !== allergenId);
          badge.classList.remove('active');
        } else {
          selectedAllergenes.push(allergenId);
          badge.classList.add('active');
        }
        applyFilters();
      });

      filterAllergenes.appendChild(badge);
    });
  }

  /* ===============================
      FONCTION : RÉINITIALISER TOUS LES FILTRES
        - 1. Vide la recherche
        - 2. Remet "Tous" actif pour thème et régime
        - 3. Remet le slider prix au max
        - 4. Vide le nombre de personnes
        - 5. Relance le filtrage
     =============================== */
  function resetFilters() {
    if (DebugConsole) console.log("[resetFilters] Réinitialisation de tous les filtres");

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

    // Remet "Tous" actif pour disponible
    selectedDisponibilite = 'Tous';
    if (filterDisponibilite) {
      const firstBadge = filterDisponibilite.querySelector('.nos_menu-badge');
      if (firstBadge) updateBadgesActive(filterDisponibilite, firstBadge);
    }

    // Relance le filtrage (affiche tous les menus)
    applyFilters();

  }

  /* ===============================
      LISTENERS : FILTRES EN TEMPS RÉEL AVEC AJAX (tout est instantané=> U_u)
        - Chaque modification d'un filtre relance applyFilters()
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

  if (DebugConsole) console.log("=== INITIALISATION PAGE NOS MENUS ===");
  loadMenus();
}