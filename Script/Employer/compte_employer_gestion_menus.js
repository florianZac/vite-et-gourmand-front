import { API_URL,sanitizeHtml } from '../config.js';
import { getToken} from '../script.js';

export function initGestionMenusEmployerPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION MENUS
     =============================== */
  
  // Variable debug console
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;
  
  // EndPoint de l'API de récupération de tout les menus pour l'affichage
  const apiMenusFull = `${API_URL}/api/menus/full`;

  // EndPoint de l'API de récupération de tout les menus pour la gestion CRUD
  const apiEmployeMenus = `${API_URL}/api/employe/menus`;

  // EndPoint de l'API de récupération des Thèmes
  const apiGetThemes = `${API_URL}/api/themes`;

  // EndPoint de l'API de récupération des Régimes
  const apiGetRegimes = `${API_URL}/api/regimes`;

  // EndPoint de l'API de récupération des plats
  const apiGetPlats = `${API_URL}/api/plats`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL          :", API_URL);
    console.log("apiMeUrl         :", apiMeUrl);
    console.log("apiMenusFull     :", apiMenusFull);
    console.log("apiEmployeMenus  :", apiEmployeMenus);
    console.log("apiGetThemes     :", apiGetThemes);
    console.log("apiGetRegimes    :", apiGetRegimes);
    console.log("apiGetPlats      :", apiGetPlats);
    console.log("========================");
  }

  /* ===============================
      RECUPERATION DES INFOS UTILISATEURS
     =============================== */

  // Récupère le token JWT depuis le cookie
  const token = getToken();

  if (!token) {
    console.error('Pas de token, impossible de charger les données');
    return;
  }

  // Headers réutilisables pour toutes les requêtes authentifiées
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (DebugConsole) {
    console.log("=== DEBUG INIT COMPTE GESTION MENU ADMIN ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel    :", token);
    console.log("================================");
  }

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */
  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // élément du dom pour le menus
  const menusList = document.getElementById('menus-list');
  const searchInput = document.getElementById('search-menu');
  const btnNewMenu = document.getElementById('btn-new-menu');
  const menuFormCard = document.getElementById('menu-form-card');
  const menuFormTitle = document.getElementById('menu-form-title');
  const btnSaveMenu = document.getElementById('btn-save-menu');
  const btnCancelMenu = document.getElementById('btn-cancel-menu');
  const btnAddPlatSelect = document.getElementById('btn-add-plat-select');
  const platsSelectContainer = document.getElementById('plats-select-container');

  // Inputs formulaire
  const inputTitre = document.getElementById('menu-titre');
  const selectTheme = document.getElementById('menu-theme');
  const selectRegime = document.getElementById('menu-regime');
  const inputDescription = document.getElementById('menu-description');
  const inputMinPersonnes = document.getElementById('menu-min-personnes');
  const inputPrix = document.getElementById('menu-prix');
  const inputQuantite = document.getElementById('menu-quantite');
  const inputConditions = document.getElementById('menu-conditions');

  // Modal suppression
  const deleteModalEl = document.getElementById('deleteMenuModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteMenuName = document.getElementById('delete-menu-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete-menu');

  // Toast
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Filtre de stock
  const filterStatus = document.getElementById('filter-status');

  // Variables
  let allMenus = [];
  let allPlats = [];
  let allThemes = [];
  let allRegimes = [];
  let currentEditId = null; // null = création, id = modification
  let currentDeleteId = null;
  let platSelectCount = 0;

  /* ===============================
      TOAST
     =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = message || "Action effectuée !";
    toastEl.classList.remove('toast-success', 'toast-error');
    toastEl.classList.add(type === 'error' ? 'toast-error' : 'toast-success');
    toastBootstrap.show();
  }


  /* ===============================
      FONCTION : AFFICHAGE DU PRÉNOM DANS LE HERO
        - 1.  Appelle GET /api/me
        - 2.  Décode le token JWT pour récupérer le prenom, nom, email, role
        - 3.  Remplit le span #hero-user-name avec le prenom récuperer du token
     =============================== */
  async function loadUserName() {
    if (DebugConsole) console.log("[loadUserName] Début - Appel GET", apiMeUrl);

    try {
      const response = await fetch(apiMeUrl, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log("[loadUserName] Réponse status :", response.status);

      if (!response.ok) {
        if (DebugConsole) console.log("[loadUserName] Réponse non OK, abandon");
        return;
      }

      let data = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (DebugConsole) console.log("[loadUserName] Données reçues :", data);

      if (heroUserName && data.utilisateur) {
        const prenom = data.utilisateur.prenom || data.utilisateur.email || '';
        heroUserName.textContent = prenom;
        if (DebugConsole) console.log("[loadUserName] Prénom affiché dans le hero :", prenom);
      } else {
        if (DebugConsole) console.log("[loadUserName] Element #hero-user-name non trouvé ou pas de donnée utilisateurs disponible");
      }

    } catch (err) {
      console.error('[loadUserName] Erreur :', err);
    }
  }
  loadUserName();

  /* ===============================
      FONCTION : RÉCUPERATION DES DONNEES API POUR LES SELECT THÈMES, RÉGIMES, PLATS
        - 1.  Récupération des données via les API Appelle GET
                apiGetThemes
                apiGetRegimes
                apiGetPlats
        - 2.  Traitement des données thèmes
        - 3.  Traitement des données régimes
        - 4.  Traitement des plats
        - 5.  Chargement des selects
     =============================== */
  async function loadSelectData() {

    try {
      if (DebugConsole) console.log("[loadSelectData] Début - Appel GET");
      
      /* ---------------------------------------
       * Récupération des données via les API
         ---------------------------------------*/
      const themesRes = await fetch(apiGetThemes, {
        method: 'GET',
        headers: authHeaders
      });
      if (DebugConsole) console.log("[loadSelectData] Réponse status apiGetThemes:", themesRes.status);
      if (!themesRes.ok) {
        if (DebugConsole) console.log("[loadSelectData] érreur Réponse, apiGetThemes:");
        console.error('[loadSelectData] Erreur apiGetThemes:', err);
        return;
      }

      const regimesRes = await fetch(apiGetRegimes, {
        method: 'GET',
        headers: authHeaders
      });
      if (DebugConsole) console.log("[loadSelectData] Réponse status regimesRes:", regimesRes.status);
      if (!regimesRes.ok) {
        if (DebugConsole) console.log("[loadSelectData] érreur Réponse, regimesRes:");
        console.error('[loadSelectData] Erreur regimesRes:', err);
        return;
      }

      const platsRes = await fetch(apiGetPlats, {
        method: 'GET',
        headers: authHeaders
      });
      if (DebugConsole) console.log("[loadSelectData] Réponse status platsRes:", platsRes.status);
      if (!regimesRes.ok) {
        if (DebugConsole) console.log("[loadSelectData] érreur Réponse, platsRes:");
        console.error('[loadSelectData] Erreur platsRes:', err);
        return;
      }

      /* ---------------------------------------
       * Traitement des données thèmes
         ---------------------------------------*/

      let themesData = {};
      if (themesRes) {
        try {
          themesData = await themesRes.json();
        } catch (error) {
          themesData = {};
        }
      }
      if (DebugConsole) console.log("[loadSelectData] Thème récuperer avec succès  :", themesRes.status, themesData);

      // Test si les données existe
      if (themesData.themes) {
        allThemes = themesData.themes;
      } else {
        allThemes = [];
      }
      if (DebugConsole) console.log("[loadSelectData] Thème :", themesRes.status, themesData);

      /* ---------------------------------------
       * Traitement des régimes
         ---------------------------------------*/

      let regimesData = {};

      if (regimesRes) {
        try {
          regimesData = await regimesRes.json();
        } catch (error) {
          regimesData = {};
        }
      }
      if (DebugConsole) console.log("[loadSelectData] régimes récuperer avec succès  :", regimesRes.status, regimesData);

      // Test si les données existe
      if (regimesData.regimes) {
        allRegimes = regimesData.regimes;
      } else {
        allRegimes = [];
      }
      if (DebugConsole) console.log("[loadSelectData] régimes :", regimesRes.status, regimesData);

      /* ---------------------------------------
       * Traitement des plats
         ---------------------------------------*/

      let platsData = {};

      if (platsRes) {
        try {
          platsData = await platsRes.json();
        } catch (error) {
          platsData = {};
        }
      }
      if (DebugConsole) console.log("[loadSelectData] Plat récuperer avec succès  :", platsRes.status, platsData);

      // Test si les données existe
      if (platsData.plats) {
        allPlats = platsData.plats;
      } else {
        allPlats = [];
      }
      if (DebugConsole) console.log("[loadSelectData] Plat :", platsRes.status, platsData);

      /* ---------------------------------------
       * Remplissage des selects
         ---------------------------------------*/

      fillSelect(selectTheme, allThemes, 'id', 'titre');
      fillSelect(selectRegime, allRegimes, 'id', 'libelle');

      if (DebugConsole) {
        console.log("[loadSelectData] Thèmes :", allThemes.length);
        console.log("[loadSelectData] Régimes :", allRegimes.length);
        console.log("[loadSelectData] Plats :", allPlats.length);
        console.log("[loadSelectData] Fin - Appel GET");
      }

    } catch (err) {
      console.error('[loadSelectData] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : REMPLISSAGE DES SELECT  THÈMES, RÉGIMES
     =============================== */
  function fillSelect(selectEl, items, valueKey, labelKey) {

    // Vérifie que l'élément existe
    if (!selectEl) {
      return;
    }

    // supprime toutes les anciennes options
    selectEl.innerHTML = '';
    items.forEach(function(item) {

      // Crée un nouvel élément pour le select
      const opt = document.createElement('option');

      // définition de sa valeur
      opt.value = item[valueKey];

      // Définit le texte visible pour l'utilisateur
      opt.textContent = item[labelKey];

      // Ajout la donnée au select
      selectEl.appendChild(opt);

      if (DebugConsole) console.log("[fillSelect] valeur:contenue  :", opt.value, opt.textContent);
    });
  }

  /* ===============================
      FONCTION : AJOUTER UN SELECT POUR LE CHOIX D'UN PLAT DANS LE SELECT
     =============================== */
  function addPlatSelect(selectedId = '') {

    /* ---------------------------------------
     *  Vérification de la Limite de 3 plats max
       ---------------------------------------*/
    if (platSelectCount >= 3) {
      showToast("Maximum 3 plats par menu.", "error");
      return; 
    }

    platSelectCount++;
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center gap-2 mb-2 plat-select-row';

    /* ---------------------------------------
     *  Création des options du select
       ---------------------------------------*/
    // Option par défaut
    let options = '<option value="">-- Choisir un plat --</option>';

    // On parcourt tous les plats
    allPlats.forEach(function(plat) {

      // Vérifie si ce plat doit être sélectionné par défaut
      let selected = '';
      if (plat.id == selectedId) {
        selected = 'selected';
      }
      if (DebugConsole) {console.log(`[addPlatSelect] : ${selected}`);}
      // Gestion des allergènes
      let allergenes = '';
      if (plat.allergenes) {
        allergenes = plat.allergenes.map(function(a) {
          return a.libelle;
        }).join(', ');
      }
      if (DebugConsole) {console.log(`[addPlatSelect] : ${allergenes}`);}
      // Construction de l'option HTML
      options += `<option value="${plat.id}" ${selected}>
        ${plat.titre} (${plat.categorie})${allergenes ? ' - ' + allergenes : ''}
      </option>`;

      if (DebugConsole) {console.log(`[addPlatSelect] : ${selected}:${allergenes}:${options}`);}
    });

    /* ---------------------------------------
     *  Remplissage du HTML avec les donnèes formatée
       ---------------------------------------*/    
    row.innerHTML = `
      <select class="form-select plat-select">${options}</select>
      <button class="btn btn-outline-danger btn-sm btn-remove-plat" title="Retirer">
        <i class="bi bi-x"></i>
      </button>
    `;

    /* ---------------------------------------
     *  Ajout dans le DOM
       ---------------------------------------*/    
    platsSelectContainer.appendChild(row);

    /* ---------------------------------------
     *  Gestion du bouton supprimer
       ---------------------------------------*/   
    const btnRemove = row.querySelector('.btn-remove-plat');

    btnRemove.addEventListener('click', function() {
      // supprime la ligne
      row.remove();  
      // diminue le compteur        
      platSelectCount--;     

    });
  }

  /* ===============================
      FONCTION : CHARGER LES MENUS PRESENT EN DDB
     =============================== */
  async function loadMenus() {
    if (DebugConsole) console.log("[loadMenus] Appel GET", apiMenusFull);
    try {

      const response = await fetch(apiMenusFull, 
      { 
        method: 'GET', 
        headers: authHeaders
      });

      if (!response.ok) { 
        console.error("[loadMenus] Erreur :", response.status); 
        if (DebugConsole) console.log("[loadMenus] érreur retour API");
        return; 
      }
      if (DebugConsole) console.log("[loadMenus] Retour API réussie");

      let data = {};
      try { 
        data = await response.json();
      } catch { 
        data = {}; 
      }
      allMenus = data.menus || [];
      if (DebugConsole) console.log("[loadMenus] Menus chargés :", allMenus.length,allMenus);
      renderMenus(allMenus);
    } catch (err) {
      console.error('[loadMenus] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : AFFICHER LES MENUS DANS LA PAGE
     =============================== */
  function renderMenus(menus) {
    if (!menusList) return;
    menusList.innerHTML = '';

    if (menus.length === 0) {
      menusList.innerHTML = '<p class="text-center text-muted">Aucun menu trouvé.</p>';
      return;
    }

    menus.forEach(menu => {
      const themeLabel = menu.theme ? menu.theme.titre : '—';
      const regimeLabel = menu.regime ? menu.regime.libelle : '—';
      const nbPlats = menu.plats ? menu.plats.length : 0;
      const enStock = (menu.quantite_restante || 0) >= (menu.nombre_personne_minimum || 1);

      if (DebugConsole) {console.log(`[renderMenus] : ${themeLabel}:${regimeLabel}:${nbPlats}:${enStock}`);}

      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-2 rounded';
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      row.innerHTML = `
        <div>
          <strong class="fs-5">${menu.titre || 'Sans titre'}</strong><br>
          <small class="text-muted">${themeLabel} · ${regimeLabel} · Min. ${menu.nombre_personne_minimum || 1} pers. · ${menu.prix_par_personne || 0}€/pers</small><br>
          <small>${nbPlats} plat(s) — ${enStock ? '<span style="color:green">En stock</span>' : '<span style="color:red">Rupture</span>'} · Qté: ${menu.quantite_restante || 0}</small>
        </div>
        <div class="d-flex flex-column gap-2">
          <button class="btn btn-secondary btn-sm btn-edit-menu" data-id="${menu.id}" title="Modifier">
            <i class="bi bi-pencil-fill me-1"></i> Modifier
          </button>
          <button class="btn btn-danger btn-sm btn-delete-menu" data-id="${menu.id}" data-titre="${menu.titre}" title="Supprimer">
            <i class="bi bi-trash-fill me-1"></i> Supprimer
          </button>
        </div>
      `;

      menusList.appendChild(row);
    });

    // Events suppression
    document.querySelectorAll('.btn-delete-menu').forEach(btn => {
      if (DebugConsole) {console.log(`[renderMenus] : Apel modal suppression`);}
      btn.addEventListener('click', () => {
        currentDeleteId = btn.dataset.id;
        deleteMenuName.textContent = btn.dataset.titre;
        deleteModal.show();
      });
    });

    // Events modification
    document.querySelectorAll('.btn-edit-menu').forEach(btn => {
      if (DebugConsole) {console.log(`[renderMenus] : Apel modal modification`);}
      btn.addEventListener('click', () => openEditForm(parseInt(btn.dataset.id)));
    });
  }

  /* ===============================
      FONCTION : OUVRIR LE FORMULAIRE DE CRÉATION D'UN MENU
     =============================== */
  function openCreateForm() {
    if (DebugConsole) console.log("[openCreateForm] Appel openCreateForm");
    currentEditId = null;
    menuFormTitle.textContent = 'Créer un menu';
    btnSaveMenu.innerHTML = '<i class="bi bi-save me-1"></i> Créer le menu';

    // Reset tous les champs
    inputTitre.value = '';
    inputDescription.value = '';
    inputMinPersonnes.value = 1;
    inputPrix.value = 0;
    inputQuantite.value = 50;
    inputConditions.value = '';
    if (selectTheme.options.length > 0) selectTheme.selectedIndex = 0;
    if (selectRegime.options.length > 0) selectRegime.selectedIndex = 0;

    // Reset plats
    platsSelectContainer.innerHTML = '';
    platSelectCount = 0;
    addPlatSelect();

    menuFormCard.classList.remove('d-none');
    menuFormCard.scrollIntoView({ behavior: 'smooth' });
    if (DebugConsole) console.log("[openCreateForm] Fin d'appel openCreateForm");
  }

  /* ===============================
      FONCTION : OUVRIR LE FORMULAIRE DE MODIFICATION
     =============================== */
  function openEditForm(menuId) {
    if (DebugConsole) console.log("[openEditForm] Appel openEditForm");

    const menu = allMenus.find(m => m.id === menuId);
    if (!menu) return;

    if (DebugConsole) console.log("[openEditForm] menu",menu);

    currentEditId = menuId;
    menuFormTitle.textContent = `Modifier : ${menu.titre}`;
    btnSaveMenu.innerHTML = '<i class="bi bi-save me-1"></i> Enregistrer';

    // Remplir les champs
    inputTitre.value = menu.titre || '';
    inputDescription.value = menu.description || '';
    inputMinPersonnes.value = menu.nombre_personne_minimum || 1;
    inputPrix.value = menu.prix_par_personne || 0;
    inputQuantite.value = menu.quantite_restante || 50;
    inputConditions.value = menu.conditions || '';

    // Sélectionner thème et régime
    if (menu.theme) selectTheme.value = menu.theme.id;
    if (menu.regime) selectRegime.value = menu.regime.id;

    if (DebugConsole) {
      console.log(`[openEditForm] : 
        ${inputTitre.value}:
        ${inputDescription.value}:
        ${inputMinPersonnes.value}:
        ${inputPrix.value}:
        ${inputQuantite.value}:
        ${inputConditions.value}:
        ${menu.theme}:
        ${menu.regime}:`
      );
    }

    // Remplir plats existants
    platsSelectContainer.innerHTML = '';
    platSelectCount = 0;
    if (menu.plats && menu.plats.length > 0) {
      menu.plats.forEach(plat => {
        if (DebugConsole) {
          console.log("[openEditForm]  id :", plat.id);
        }
        addPlatSelect(plat.id);
      });
    } else {
      if (DebugConsole) {
        console.log("[openEditForm] menu.plats aucun plat");
      }
      addPlatSelect();
    }

    menuFormCard.classList.remove('d-none');
    menuFormCard.scrollIntoView({ behavior: 'smooth' });
    if (DebugConsole) console.log("[openEditForm] Fin d'appel openEditForm");
  }

  /* ===============================
      SAUVEGARDER, CRÉER OU MODIFIER UN MENU
     =============================== */
  btnSaveMenu.addEventListener('click', async () => {
    if (DebugConsole) console.log("[openEditForm] Appel btnSaveMenu");
    const titre = inputTitre.value.trim();
    const description = inputDescription.value.trim();
    const nombre_personne_minimum = parseInt(inputMinPersonnes.value) || 1;
    const prix_par_personne = parseFloat(inputPrix.value) || 0;
    const quantite_restante = parseInt(inputQuantite.value) || 50;
    const conditions = inputConditions.value.trim();
    const theme_id = parseInt(selectTheme.value);
    const regime_id = parseInt(selectRegime.value);

    if (DebugConsole) {
      console.log(`[btnSaveMenu] : 
        ${titre}:
        ${description}:
        ${nombre_personne_minimum}:
        ${prix_par_personne}:
        ${quantite_restante}:
        ${conditions}:
        ${theme_id}:
        ${regime_id}`
      );
    }

    // Récupérer les plats sélectionnés
    const platSelects = document.querySelectorAll('.plat-select');
    const plats = [];
    platSelects.forEach(sel => {
      if (sel.value) {
        console.log(`[btnSaveMenu] plat selectionné : ${sel.value} `);
        plats.push(parseInt(sel.value));
      }
    });

    // Validations
    if (!titre) { showToast("Le titre est obligatoire.", "error"); return; }
    if (!description) { showToast("La description est obligatoire.", "error"); return; }
    if (prix_par_personne <= 0) { showToast("Le prix doit être supérieur à 0.", "error"); return; }
    if (!theme_id) { showToast("Veuillez sélectionner un thème.", "error"); return; }
    if (!regime_id) { showToast("Veuillez sélectionner un régime.", "error"); return; }

    const body = { titre, description, nombre_personne_minimum, prix_par_personne, quantite_restante, theme_id, regime_id, plats };
    if (conditions) body.conditions = conditions;

    const isEdit = currentEditId !== null;
    const url = isEdit ? `${apiEmployeMenus}/${currentEditId}` : apiEmployeMenus;
    const method = isEdit ? 'PUT' : 'POST';

    if (DebugConsole) console.log(`[saveMenu] ${method}`, url, body);

    try {
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast(isEdit ? "Menu modifié avec succès !" : "Menu créé avec succès !");
        menuFormCard.classList.add('d-none');
        currentEditId = null;
        loadMenus();
      } else {
        showToast(data.message || "Erreur lors de la sauvegarde.", "error");
      }
    } catch (err) {
      console.error('[saveMenu] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
    
    if (DebugConsole) console.log("[openEditForm] Fin d'appel btnSaveMenu");
  });

  /* ===============================
      SUPPRESSION MENU (MODALE)
     =============================== */
  confirmDeleteBtn.addEventListener('click', async () => {
    if (DebugConsole) console.log("[openEditForm] Appel confirmDeleteBtn");
    if (!currentDeleteId) return;

    const url = `${apiEmployeMenus}/${currentDeleteId}`;
    if (DebugConsole) console.log("[deleteMenu] DELETE", url);

    try {
      const response = await fetch(url, { method: 'DELETE', headers: authHeaders });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Menu supprimé !");
        loadMenus();
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deleteMenu] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    deleteModal.hide();
    currentDeleteId = null;
    if (DebugConsole) console.log("[openEditForm] Fin d'appel confirmDeleteBtn");
  });

  /* ===============================
      FONCTION : APPLIQUER LES FILTRES RECHERCHE ET STOCK DISPONIBLE
     =============================== */
  function applyFilters() {

    let search = "";
    let status = "";

    if (searchInput) {
      search = searchInput.value.toLowerCase().trim();
    }

    if (filterStatus) {
      status = filterStatus.value;
    }

    if (DebugConsole) {
      console.log("[applyFilters] search:", search, "status:", status);
    }

    const filtered = allMenus.filter(function(menu) {

      /*
       * Filtre des stocks disponible
      */
      if (status !== "") {

        let quantite = 0;
        let minimum = 1;

        if (menu.quantite_restante) {
          quantite = menu.quantite_restante;
        }

        if (menu.nombre_personne_minimum) {
          minimum = menu.nombre_personne_minimum;
        }

        let enStock = false;

        if (quantite >= minimum) {
          enStock = true;
        } else {
          enStock = false;
        }

        if (status === "En stock") {
          if (enStock === false) {
            return false;
          }
        }

        if (status === "Rupture") {
          if (enStock === true) {
            return false;
          }
        }
      }
      if (DebugConsole) {
        console.log("[applyFilters] status:", status);
      }

      /*
       * Filtre recherche
      */
      if (search !== "") {

        let titre = "";
        let theme = "";
        let regime = "";

        // Récupère le titre du menu
        if (menu.titre) {
          titre = menu.titre.toLowerCase();
        }
        // Récupère le titre du thème
        if (menu.theme && menu.theme.titre) {
          theme = menu.theme.titre.toLowerCase();
        }
        // Récupère le libellé du régime
        if (menu.regime && menu.regime.libelle) {
          regime = menu.regime.libelle.toLowerCase();
        }
        if (DebugConsole) {
          console.log("[applyFilters] titre:", titre);
          console.log("[applyFilters] theme:", theme);
          console.log("[applyFilters] regime:", regime);
        }
        let contientRecherche = false;

        // Retourne true si une des valeurs contient le texte recherché
        if (titre.includes(search)) {
          contientRecherche = true;
        } else if (theme.includes(search)) {
          contientRecherche = true;
        } else if (regime.includes(search)) {
          contientRecherche = true;
        } else {
          contientRecherche = false;
        }

        if (contientRecherche === false) {
          return false;
        }
        if (DebugConsole) {
          console.log("[applyFilters] contientRecherche:", contientRecherche);
        }
      }

      return true;
    });

    // Affiche uniquement les menus filtrés
    renderMenus(filtered);
  }

  /* ===============================
      LISTENERS FILTRES
     =============================== */
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (filterStatus) {
    filterStatus.addEventListener('change', applyFilters);
  }

  /* ===============================
      LISTENERS BOUTONS
     =============================== */

  btnNewMenu.addEventListener('click', openCreateForm);
  btnCancelMenu.addEventListener('click', () => {
    menuFormCard.classList.add('d-none');
    currentEditId = null;
  });
  btnAddPlatSelect.addEventListener('click', () => addPlatSelect());

  /* ===============================
      INITIALISATION
     =============================== */
  // récupère les données
  loadSelectData().then(() => loadMenus());
}