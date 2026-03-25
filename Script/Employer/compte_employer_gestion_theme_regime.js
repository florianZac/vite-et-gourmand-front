import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initGestionThemeRegimeEmployerPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION THEME & REGIME
     =============================== */
  
  // Active/désactive les logs dans la console (debug)
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération  tous les themes
  const apiGetThemes = `${API_URL}/api/themes`;

  // EndPoint de l'API de gestion CRUD (Create, Update, Delete) des themes
  const apiEmployeThemes = `${API_URL}/api/employe/themes`;

  // EndPoint de l'API pour récupérer tous les régimes
  const apiGetRegimes = `${API_URL}/api/regimes`;

  // EndPoint de l'API pour la gestion CRUD (Create, Update, Delete) des regimes
  const apiEmployeRegimes = `${API_URL}/api/employe/regimes`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL          :", API_URL);
    console.log("apiMeUrl         :", apiMeUrl);
    console.log("apiGetThemes     :", apiGetThemes);
    console.log("apiEmployeThemes :", apiEmployeThemes);
    console.log("apiGetRegimes     :", apiGetRegimes);
    console.log("apiEmployeRegimes :", apiEmployeRegimes);
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

  if (DebugConsole) {
    console.log("=== DEBUG INIT COMPTE ADMIN ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel :", token);
    console.log("Rôle actuel :", getRole());
    console.log("================================");
  }

  // Headers réutilisables pour toutes les requêtes authentifiées
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // Liste des Thèmes
  const themesList = document.getElementById('themes-list');
  // Champ input pour ajouter un Thème
  const newThemeInput = document.getElementById('new-theme')
  // Bouton d'ajout d'un nouveaux Thème
  const btnAddTheme = document.getElementById('btn-add-theme');

  // Liste des Régimes
  const regimesList = document.getElementById('regimes-list');
  // Champ input pour ajouter un Régimes
  const newRegimeInput = document.getElementById('new-regime');
  // Bouton d'ajout d'un nouveaux Régimes
  const btnAddRegime = document.getElementById('btn-add-regime');

  // Toast Bootstrap
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Modal suppression partagée pour thèmes et régimes
  const deleteModalEl = document.getElementById('deleteModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteModalTitle = document.getElementById('delete-modal-title');
  const deleteItemName = document.getElementById('delete-item-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete');

  // Modal modification partagée pour thèmes et régimes
  const editModalEl = document.getElementById('editModal');
  const editModal = new bootstrap.Modal(editModalEl);
  const editModalTitle = document.getElementById('edit-modal-title');
  const editLibelleInput = document.getElementById('edit-item-libelle');
  const confirmEditBtn = document.getElementById('confirm-edit');

  // Variables temporaires pour les modales pour stocker les IDs en cours
  let currentDeleteId = null;
  let currentEditId = null;
  // Variable de choix 'theme' ou 'regime'
  let currentType = null;

  /* ===============================
      FONCTION : TOAST BOOTSTRAP POUR ENVOYER LES MESSAGES A l'ADMIN
     =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    // Texte du message
    body.textContent = message || "Action effectuée !";
    // Reset des classes
    toastEl.classList.remove('toast-success', 'toast-error');
    // Ajout de la bonne classe selon type
    toastEl.classList.add(type === 'error' ? 'toast-error' : 'toast-success');
    // Affichage
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
      const response = await fetch(apiMeUrl, {method: 'GET',headers: authHeaders});

      if (DebugConsole) console.log("[loadUserName] Réponse status :", response.status);

      if (!response.ok) {
        if (DebugConsole) console.log("[loadUserName] érreur Réponse, abandon");
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
      FONCTION UTILITAIRE : OUVRE MODALE SUPPRESSION
     =============================== */
  function openDeleteModal(id, name, type) {

    // On stocke l'ID à supprimer
    currentDeleteId = id;

    // On stocke le type (theme ou regime)
    currentType = type;

    let label;
    // On vérifie le type pour définir le bon label
    if (type === 'theme') {
      label = 'le thème'; 
    } else {
      label = 'le régime'; 
    }
    // On met à jour le titre
    deleteModalTitle.innerHTML = `<i class="bi bi-trash text-danger me-2"></i>Supprimer ${label}`;
    // On affiche le nom à supprimer
    deleteItemName.textContent = name;
    // On ouvre la modale de suppression
    deleteModal.show();
  }

  function openEditModal(id, name, type) {

    // On stocke l'ID à modifier
    currentEditId = id;

    // On stocke le type (theme ou regime)
    currentType = type;

    let label;
    let placeholder;

    // On vérifie le type pour adapter le texte
    if (type === 'theme') {
      label = 'le thème'; 
      placeholder = 'Nouveau nom de thème...';
    } else {
      label = 'le régime'; 
      placeholder = 'Nouveau nom de régime...'; 
    }

    // On met à jour le titre de la modale
    editModalTitle.innerHTML = `<i class="bi bi-pencil me-2"></i>Modifier ${label}`;

    // On remplit le champ avec le nom actuel
    editLibelleInput.value = name;

    // On met à jour le placeholder
    editLibelleInput.placeholder = placeholder;

    // On affiche la modale
    editModal.show();
  }

  /* ===============================
      FONCTION : AFFICHAGE & RECUPERATION DE LA LISTE THEMES EN DDB 
     =============================== */
  function renderthemes(themes) {

    themesList.innerHTML = '';

    // Titre au-dessus de la liste des thèmes
    const title = document.createElement('h3');
    title.className = 'fw-bold mb-3 text-center';
    title.textContent = 'Liste des Thèmes';
    themesList.appendChild(title);

    // Récupère les thèmes présent en ddb pour les afficher dynamiquement
    themes.forEach(theme => {

      // Création du conteneur
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-2 rounded';

      // Style
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      row.innerHTML = `
        <span class="fw-semibold">${theme.titre}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-danger btn-sm btn-delete-theme" data-id="${theme.id}" data-titre="${theme.titre}" title="Supprimer">
            <i class="bi bi-trash-fill"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm btn-edit-theme" data-id="${theme.id}" data-titre="${theme.titre}" title="Modifier">
            <i class="bi bi-pencil-fill"></i>
          </button>
        </div>
      `;
      // Ajout au DOM
      themesList.appendChild(row);
    });

    // ===== EVENTS MODALE SUPPRESSION THÈMES =====
    document.querySelectorAll('.btn-delete-theme').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.titre, 'theme'));
    });
    
    // ===== EVENTS MODALE MODIFICATION THÈMES =====
    document.querySelectorAll('.btn-edit-theme').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id, btn.dataset.titre, 'theme'));
    });

    if (DebugConsole) console.log("[renderThemes] Taille :", themes.length);
  }

  /* ===============================
      FONCTION : AFFICHAGE & RECUPERATION DE LA LISTE REGIME EN DDB 
     =============================== */
  function renderRegimes(regimes) {

    regimesList.innerHTML = '';

    // Titre au-dessus de la liste des regimes
    const title = document.createElement('h3');
    title.className = 'fw-bold mb-3 text-center';
    title.textContent = 'Liste des Régimes';
    regimesList.appendChild(title);

    // Récupère les Régimes présent en ddb pour les afficher dynamiquement
    regimes.forEach(regime => {

      // Création du conteneur
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-2 rounded';

      // Style
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      // Remplissage du contenue
      row.innerHTML = `
        <span class="fw-semibold">${regime.libelle}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-danger btn-sm btn-delete-regime" data-id="${regime.id}" data-libelle="${regime.libelle}" title="Supprimer">
            <i class="bi bi-trash-fill"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm btn-edit-regime" data-id="${regime.id}" data-libelle="${regime.libelle}" title="Modifier">
            <i class="bi bi-pencil-fill"></i>
          </button>
        </div>
      `;

      // Ajout au DOM
      regimesList.appendChild(row);
    });

    // ===== EVENTS MODALE SUPPRESSION =====
    document.querySelectorAll('.btn-delete-regime').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.libelle, 'regime'));
    });

    // ===== EVENTS MODALE MODIFICATION =====
    document.querySelectorAll('.btn-edit-regime').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id, btn.dataset.libelle, 'regime'));
    });

    if (DebugConsole) console.log("[renderRegimes] Taille :", regimes.length);
  }

  /* ===============================
      CHARGEMENT DES THÈMES AVEC LES INFORMATONS PRESENTE EN DDB
     =============================== */
  async function loadthemes() {
    if (DebugConsole) console.log("[loadthemes] Appel GET", apiGetThemes);
    try {
      const response = await fetch(apiGetThemes, { method: 'GET', headers: authHeaders });

      if (!response.ok) {
        console.error("[loadthemes] Erreur status :", response.status);
        return;
      }

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[loadthemes] Données reçues :", data);

      if (data.themes && Array.isArray(data.themes)) {
        renderthemes(data.themes);
      }
    } catch (err) {
      console.error('[loadthemes] Erreur :', err);
    }
  }
  loadthemes();

  /* ===============================
      CHARGEMENT LES RÈGIMES AVEC LES INFORMATONS PRESENTE EN DDB
     =============================== */
  async function loadRegimes() {
    if (DebugConsole) console.log("[loadRegimes] Appel GET", apiGetRegimes);
    try {
      const response = await fetch(apiGetRegimes, { method: 'GET', headers: authHeaders });

      if (!response.ok) {
        console.error("[loadRegimes] Erreur status :", response.status);
        return;
      }

      let data = {};
      try { 
        data = await response.json(); 
      } 
      catch { 
        data = {}; 
      }

      if (DebugConsole) console.log("[loadRegimes] Données reçues :", data);
      if (data.regimes && Array.isArray(data.regimes)){
      renderRegimes(data.regimes);
      }
    } catch (err) {
      console.error('[loadRegimes] Erreur :', err);
    }
  }
  loadRegimes();

  /* ===============================
      AJOUT THÈME
     =============================== */
  // On écoute le clic sur le bouton "Ajouter"
    btnAddTheme.addEventListener('click', async () => {
    // On récupère la valeur de l'input + suppression des espaces inutiles
    const libelle  = newThemeInput.value.trim();

    // Vérification : si le champ est vide
    if (!libelle ) {
      showToast("Veuillez entrer un nom de thème.", "error");
      return;
    }

    if (DebugConsole) console.log("[addtheme] POST", apiEmployeThemes, { libelle });

    // Requête POST pour ajouter un Thème
    try {
      const response = await fetch(apiEmployeThemes, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ libelle})
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[addtheme] Réponse :", response.status, data);

      if (response.ok) {
        showToast("Thème ajouté avec succès !");
        newThemeInput.value = '';
        loadthemes();
      } else {
        showToast(data.message || "Erreur lors de l'ajout.", "error");
      }
    } catch (err) {
      console.error('[addtheme] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

  /* ===============================
      AJOUT RÈGIMES
     =============================== */
  // On écoute le clic sur le bouton "Ajouter"
  btnAddRegime.addEventListener('click', async () => {
    // On récupère la valeur de l'input + suppression des espaces inutiles
    const libelle = newRegimeInput.value.trim();

    // Vérification : si le champ est vide
    if (!libelle) {
      showToast("Veuillez entrer un nom d'un Régime.", "error");
      return;
    }

    if (DebugConsole) console.log("[addRegime] POST", apiEmployeRegimes, { libelle });
    // Requête POST pour ajouter un Régimes
    try {
      const response = await fetch(apiEmployeRegimes, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ libelle })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[addRegime] Réponse :", response.status, data);

      if (response.ok) {
        showToast("Régime ajouté avec succès !");
        newRegimeInput.value = '';
        loadRegimes();
      } else {
        showToast(data.message || "Erreur lors de l'ajout.", "error");
      }
    } catch (err) {
      console.error('[addRegime] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

 /* ===============================
      SUPPRESSION THÈME (MODALE PARTAGÉE)
    =============================== */
  confirmDeleteBtn.addEventListener('click', async () => {

    if (!currentDeleteId || !currentType) return;

    let baseUrl;

    // On vérifie le type pour choisir la bonne URL API
    if (currentType === 'theme') {
      baseUrl = apiEmployeThemes; // URL pour les thèmes
    } else {
      baseUrl = apiEmployeRegimes; // URL pour les régimes
    }

    const url = `${baseUrl}/${currentDeleteId}`;
    if (DebugConsole) console.log(`[delete-${currentType}] DELETE`, url);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast(`${currentType === 'theme' ? 'Thème' : 'Régime'} supprimé !`);
        loadthemes(); //recharge la liste des thèmes
        loadRegimes(); //recharge la liste des régimes
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deletetheme] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
    // Fermeture de la modale
    deleteModal.hide();
    // Reset de l'ID
    currentDeleteId = null;
    // Reset du type
    currentType = null;
  });


  /* ===============================
      MODIFICATION THÈME (MODALE PARTAGÉE THEME REGIME)
     =============================== */
  // On écoute le bouton de confirmation dans la modale d'édition
  confirmEditBtn.addEventListener('click', async () => {

    // Sécurité : si aucun ID sélectionné est que le type n'est pas définit on arrete 
    if (!currentEditId || !currentType) return;

    // Récupération du nouveau libellé
    const libelle  = editLibelleInput.value.trim();
    if (!libelle ) {
      showToast("Le libellé ne peut pas être vide.", "error");
      return;
    }
    let baseUrl;
    // On vérifie le type pour choisir la bonne URL API
    if (currentType === 'theme') {
      baseUrl = apiEmployeThemes; // URL pour les thèmes
    } else {
      baseUrl = apiEmployeRegimes; // URL pour les régimes
    }

    const url = `${baseUrl}/${currentEditId}`;
    if (DebugConsole) console.log(`[update-${currentType}] PUT`, url, {libelle});

    // Requête PUT(update) pour modifier le thème
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({libelle})
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast(`${currentType === 'theme' ? 'Thème' : 'Régime'} modifié avec succès !`);
        loadthemes();
        loadRegimes();
      } else {
        showToast(data.message || "Erreur lors de la modification.", "error");
      }
    } catch (err) {
      console.error('[updateTheme] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    // Fermeture de la modale
    editModal.hide();

    // Reset ID
    currentEditId = null;
    // Reset du type 
    currentType = null;
  });

}