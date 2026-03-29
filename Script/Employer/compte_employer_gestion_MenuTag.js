import { API_URL } from '../config.js';
import {getToken, sanitizeInput, sanitizeHtml } from '../script.js';

export function initGestionTagMenuPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION TAG MENU
     =============================== */
  
  // Active/désactive les logs dans la console (debug)
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour récupérer tous les TAG MENU
  const apiTags = `${API_URL}/api/employe/menu-tags`;

  // Endpoint de l'API pour récupérer les menus 
  const apiMenus = `${API_URL}/api/employe/menus`;

  // Endpoint de l'API pour supprime un tag d’un menu existant  ou assigné
  const apiBase = `${API_URL}/api/employe`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("apiMeUrl :", apiMeUrl);
    console.log("apiTags :", apiTags);
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
    console.log("=== DEBUG INIT COMPTE ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel :", token);
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
  const heroName = document.getElementById('hero-user-name'); 
  // Liste des Tag Menu
  const tagMenuList = document.getElementById('tag-menus-list');
  // Champ input pour ajouter un Tag Menu
  const newTagMenuInput = document.getElementById('new-tag-menus');
  // Bouton d'ajout d'un nouveaux Tag Menu 
  const btnAdd = document.getElementById('btn-add-tag-menus');
  // Toast Bootstrap
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Modal suppression
  const deleteModalEl = document.getElementById('deleteModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteName = document.getElementById('delete-tag-menus-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete');

  // Modal modification
  const editModalEl = document.getElementById('editModal');
  const editModal = new bootstrap.Modal(editModalEl);
  const editInput = document.querySelector('#editModal input');
  const confirmEditBtn = document.getElementById('confirm-edit');

  // Drag & drop tag vers un menus
  const container = document.getElementById('menus-list');
  const menuTagsContainer = document.getElementById('menu-tags');
  const dispoTagsContainer = document.getElementById('tags-list');


  // Variables temporaires pour les modales pour stocker les IDs en cours
  let currentDeleteId = null;
  let currentEditId = null;

  // Variable pour le drag & drop
  let currentMenuId = null;

  /* ===============================
      FONCTION : TOAST BOOTSTRAP POUR ENVOYER LES MESSAGES A l'ADMIN
     =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    // Texte du message
    body.textContent = sanitizeHtml(message || "Action effectuée !");
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
      // Requête GET utilisateur
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
      // Sécurité : évite crash si pas JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (DebugConsole) console.log("[loadUserName] Données reçues :", data);

      // Si utilisateur présent on affiche le nom
      if (heroName && data.utilisateur) {
        const prenom = sanitizeHtml(data.utilisateur.prenom || data.utilisateur.email || '');
        heroName.textContent = prenom;
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
      FONCTION : CHARGEMENT DES TAGS
     =============================== */

  async function loadTags() {
    if (DebugConsole) console.log("[loadTags] Début");
    try {
      const response = await fetch(apiTags, { 
        headers: authHeaders 
      });

      if (DebugConsole) console.log("[loadTags] Réponse status :", response.status);

      if (!response.ok) {
        if (DebugConsole) console.log("[loadTags] Réponse non OK, abandon");
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (DebugConsole) console.log("[loadTags] Données Tags: ", data);

      renderTags(data.tags || []);
      renderDraggableTags(data.tags || []);
    } catch (err) {
      console.error(err);
    }
  }

  /* ===============================
      FONCTION : CHARGEMENT DES MENUS
     =============================== */
  async function loadMenus() {
    if (DebugConsole) console.log("[loadMenus] Début: ");
    try {
      const response = await fetch(apiMenus, { headers: authHeaders });

      if (DebugConsole) console.log("[loadMenus] Réponse status :", response.status);

      if (!response.ok) {
        if (DebugConsole) console.log("[loadMenus] Réponse non OK, abandon");
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (DebugConsole) console.log("[loadMenus] Données Menus : ", data);

      renderMenus(data.menus || []);
    } catch (err) {
      console.error(err);
    }
  }

  /* ===============================
      FONCTION : AFFICHAGE & RECUPERATION DE LA LISTE TAG EN DDB 
     =============================== */
  function renderTags(tags) {
    tagMenuList.innerHTML = '';

    // Récupère les tag présent en ddb pour les afficher dynamiquement
    tags.forEach(tag => {

      const libelle  = sanitizeHtml(tag.libelle);

      // Création du conteneur
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-2';

      // Style
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      // Remplissage du contenue
      row.innerHTML = `
        <span class="fw-semibold">${libelle}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-danger btn-sm btn-delete" data-id="${tag.id}" data-tag="${libelle}" title="Supprimer">
            <i class="bi bi-trash-fill"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm btn-edit" data-id="${tag.id}" data-tag="${libelle}" title="Modifier">
            <i class="bi bi-pencil-fill"></i>
          </button>
        </div>
      `;

      // Ajout au DOM
      tagMenuList.appendChild(row);
    });
    attachEvents();
  }

  /* ===============================
      FONCTION : AFFICHAGE DES MENUS EN DDB 
     =============================== */
  function renderMenus(menus) {
    container.innerHTML = '';

    menus.forEach(menu => {
      const element = document.createElement('button');
      element.className = 'list-group-item list-group-item-action';
      element.textContent = menu.titre;

      element.addEventListener('click', () => {

        currentMenuId = menu.id;
        if (DebugConsole) {console.log(" [renderMenus]: menu_id: ", menu.id,"currentMenuId: ", currentMenuId );}

        document.querySelectorAll('#menus-list button')
        .forEach(btn => btn.classList.remove('active'));

        element.classList.add('active');
        loadMenuTags(menu.id);

      });
      container.appendChild(element);
    });
  } 

  /* ===============================
      FONCTION : ASSOCIATION EVENT MODALE 
     =============================== */
  function attachEvents() {

    // ===== EVENTS MODALE SUPPRESSION =====
    // Attache les événements pour la suppresion 
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        // stock ID
        currentDeleteId = btn.dataset.id; 
        // nom affiché
        deleteName.textContent = sanitizeInput(btn.dataset.tag);
        // ouverture modal
        deleteModal.show();
      });
    });

    // ===== EVENTS MODALE MODIFICATION =====
    // Attache les événements pour la modification 
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        currentEditId = btn.dataset.id;
        editInput.value = sanitizeInput(btn.dataset.tag);
        editModal.show();
      });
    });
  }

   /* ===============================
       AJOUT TAG
      =============================== */
  // On écoute le clic sur le bouton "Ajouter"
  btnAdd.addEventListener('click', async () => {

    // On récupère la valeur de l'input + suppression des espaces inutiles
    const tag = sanitizeInput(newTagMenuInput.value.trim());

    const originalText = btnAdd.innerHTML;

    // Remplace le texte par un spinner
    btnAdd.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      Ajout en cours...
    `;
    btnAdd.classList.add('d-flex', 'align-items-center', 'justify-content-center');
    // désative le bouton le temp de la réponse APi
    btnAdd.disabled = true;

    // Vérification : si le champ est vide
    if (!tag) {
      showToast("Veuillez entrer un nom de tag.", "error");
      return;
    }

    if (DebugConsole) console.log("[addTag] POST", apiTags, {libelle: tag });

    // Requête POST pour ajouter un Tag
    try {
      const response = await fetch(apiTags, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ libelle: tag }) 
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[addTag] Réponse :", response.status, data);

      if (response.ok) {
        showToast("Tag ajouté avec succès !");
        newTagMenuInput.value = '';
        loadTags();
      } else {
        showToast(data.message || "Erreur lors de l'ajout.", "error");
      }
    } catch (err) {
      console.error('[addTag] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    // Restaure le texte original
    btnAdd.innerHTML = originalText;
    btnAdd.disabled = false;
  });

  /* ===============================
      SUPPRESSION ALLERGÈNE (MODALE)
     =============================== */
  confirmDeleteBtn.addEventListener('click', async () => {

    if (!currentDeleteId) return;

    const url = `${apiTags}/${currentDeleteId}`;
    if (DebugConsole) console.log("[deleteTag] DELETE", url);

    const originalText = btnAdd.innerHTML;

    // Remplace le texte par un spinner
    confirmDeleteBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
       Supression en cours ..
    `;
    confirmDeleteBtn.classList.add('d-flex', 'align-items-center', 'justify-content-center');
    // désative le bouton le temp de la réponse APi
    confirmDeleteBtn.disabled = true;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Tag supprimé !");
        loadTags(); //recharge la liste des Tags
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deleteTag] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    // Restaure le texte original
    confirmDeleteBtn.innerHTML = originalText;
    confirmDeleteBtn.disabled = false;

    // Fermeture de la modale
    deleteModal.hide();
    // Reset de l'ID
    currentDeleteId = null;
  });

  /* ===============================
      MODIFICATION TAG (MODALE)
     =============================== */
  // On écoute le bouton de confirmation dans la modale d'édition
  confirmEditBtn.addEventListener('click', async () => {

    // Sécurité : si aucun ID sélectionné on arrete 
    if (!currentEditId) return;

    // Récupération du nouveau tag
    const tag = sanitizeInput(editInput.value.trim());
    if (!tag) {
      showToast("Le tag ne peut pas être vide.", "error");
      return;
    }

    const url = `${apiTags}/${currentEditId}`;
    if (DebugConsole) console.log("[updateTag] PUT", url, { tag });

    // Stockage de la valeur initiale
    const originalText = confirmEditBtn.innerHTML;
    // Remplace le texte par un spinner
    confirmEditBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      Modification en cours...
    `;
    confirmEditBtn.classList.add('d-flex', 'align-items-center', 'justify-content-center');

    // désative le bouton le temp de la réponse APi
    confirmEditBtn.disabled = true;

    // Requête PUT(update) pour modifier l'allergène
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ libelle: tag }) 
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("tag modifié avec succès !");
        loadTags(); // Recharge liste
      } else {
        showToast(data.message || "Erreur lors de la modification.", "error");
      }
    } catch (err) {
      console.error('[updateTag] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    // Restaure le texte original
    confirmEditBtn.innerHTML = originalText;
    confirmEditBtn.disabled = false;

    // Fermeture de la modale
    editModal.hide();

    // Reset ID
    currentEditId = null;
  });

  /* ===============================
      FONCTION : AFFICHAGE DRAG&DROP TAG MENU
     =============================== */
  async function loadMenuTags(menuId) {
    if (DebugConsole) console.log("[loadMenuTags] Début: ",menuId);

    try {
      const response = await fetch(`${apiMenus}/${menuId}`, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log("[loadMenuTags] Réponse status :", response.status);

      if (!response.ok) {
        if (DebugConsole) console.log("[loadMenuTags] Réponse non OK, abandon");
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } 
      catch {data = {};}

      if (DebugConsole) console.log("[loadMenuTags] Données reçues :", data);
      renderMenuTags(data.tags || []);
    } catch (err) {
      console.error('[loadUserName] Erreur :', err);
    }
  }

  /* ===============================
    FONCTION : TAGS DRAGGABLE DISPONIBLE
    =============================== */
  function renderDraggableTags(tags) {
    if (DebugConsole) console.log("[renderDraggableTags] Début: ",tags);
    dispoTagsContainer.innerHTML = '';

    tags.forEach(tag => {
      const element = document.createElement('div');

      element.className = 'badge bg-primary m-1 p-2';
      element.textContent = tag.libelle;
      element.draggable = true;

      element.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('tagId', tag.id);
        if (DebugConsole) console.log("[renderDraggableTags] DRAG START:", tag.id);
      });

      dispoTagsContainer.appendChild(element);
    });
  }

  /* ===============================
    FONCTION : AFFICHAGE MENUS TAGS DISPONIBLE
    =============================== */
  function renderMenuTags(tags) {
  if (DebugConsole) console.log("[renderMenuTags] Début: ",tags);
    menuTagsContainer.innerHTML = '';

    if (tags.length === 0) {
      menuTagsContainer.innerHTML = `<p class="text-muted">Aucun tag</p>`;
      return;
    }

    tags.forEach(tag => {

      const element = document.createElement('span');
      element.className = 'badge bg-success m-1 p-2 cursor-pointer';
      element.textContent = tag.libelle;

      // SUPPRESSION AU CLIC
      element.addEventListener('click', () => {
        removeTagFromMenu(tag.id);
      });

      menuTagsContainer.appendChild(element);
      if (DebugConsole) console.log("[renderMenuTags] :", tag.id);
    });
  }

  /* ===============================
      DROP ZONE EVENTS
     =============================== */

  // autoriser le drop
  menuTagsContainer.addEventListener('dragover', event => {
    event.preventDefault();
    menuTagsContainer.classList.add('bg-success-subtle');
  });

  // quitter zone
  menuTagsContainer.addEventListener('dragleave', () => {
    menuTagsContainer.classList.remove('bg-success-subtle');
  });

  // DROP
  menuTagsContainer.addEventListener('drop', async (event) => {
    event.preventDefault();
    menuTagsContainer.classList.remove('bg-success-subtle');

    const tagId = event.dataTransfer.getData('tagId');

    if (!currentMenuId || !tagId) return;

    if (DebugConsole) console.log("[DROP] DROP:", tagId );

    await assignTag(currentMenuId, tagId);
  });
    
  /* ===============================
    FONCTION : ASSIGN UN TAG
    =============================== */
  async function assignTag(menuId, tagId) {
    if (DebugConsole) console.log("[assignTag] Début menuId: ",menuId, "tagId: ",tagId);
      const response = await fetch(`${apiBase}/menus/${menuId}/tags/${tagId}`, {
        method: 'POST',
        headers: authHeaders
      });
    
      if (!response.ok) {
        if (DebugConsole) console.log("[assignTag] Réponse non OK, abandon");
        let data = {};
        try { data = await response.json(); } catch {}
        showToast(data.message || "Erreur", "error");
        return;
      }
      if (DebugConsole) console.log("[assignTag] Réponse status :", response.status);
      showToast("Tag assigné");
      loadMenuTags(menuId);
  }

  /* ===============================
      FONCTION : DESASIGNITATION D'UN TAG SUR UN MENU 
     =============================== */
  async function removeTagFromMenu(tagId) {
    if (DebugConsole) console.log("[removeTagFromMenu] Début tagId: ",tagId);
    try {
      const response = await fetch(`${apiBase}/menus/${currentMenuId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!response.ok) {

        if (DebugConsole) console.log("[removeTagFromMenu] Réponse non OK, abandon");
        return;

      }else if(response.ok) {
        if (DebugConsole) console.log("[removeTagFromMenu] Réponse status :", response.status);
      }
      if (response.ok) {
        showToast("Tag supprimé");
        loadMenuTags(currentMenuId);
      }else {
        showToast(data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur réseau", "error");
    }
  }

  /* ===============================
      INITIALISATION
     =============================== */
  loadMenus();
  loadTags(); 
}