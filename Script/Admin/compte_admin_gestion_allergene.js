import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCompteAdminGestionAllergenePage() {

  /* ===============================
    SCRIPT PAGE ADMIN GESTION ALLERGENE
    =============================== */
  
  // Active/désactive les logs dans la console (debug)
  let DebugConsole = true;

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // URL pour récupérer tous les allergènes
  const apiGetAllergenes = `${API_URL}/api/allergenes`;

  // URL de gestion CRUD (Create, Update, Delete) des allergènes
  const apiEmployeAllergenes = `${API_URL}/api/employe/allergenes`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("apiGetAllergenes :", apiGetAllergenes);
    console.log("apiEmployeAllergenes :", apiEmployeAllergenes);
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
  const heroName = document.getElementById('hero-user-name'); 
  // Liste des allergènes
  const allergenesList = document.getElementById('allergenes-list');
  // Champ input pour ajouter un allergène
  const newAllergeneInput = document.getElementById('new-allergene');
  // Bouton d'ajout d'un nouvelle allegène
  const btnAdd = document.getElementById('btn-add-allergene');
  // Toast Bootstrap
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Modal suppression
  const deleteModalEl = document.getElementById('deleteModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteAllergeneName = document.getElementById('delete-allergene-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete');

  // Modal modification
  const editModalEl = document.getElementById('editModal');
  const editModal = new bootstrap.Modal(editModalEl);
  const editLibelleInput = document.getElementById('edit-allergene-libelle');
  const confirmEditBtn = document.getElementById('confirm-edit');

  // Variables temporaires pour les modales pour stocker les IDs en cours
  let currentDeleteId = null;
  let currentEditId = null;

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
        const prenom = data.utilisateur.prenom || data.utilisateur.email || '';
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
     FONCTION : AFFICHAGE & RECUPERATION DE LA LISTE ALLERGÈNES EN DDB 
     =============================== */
  function renderAllergenes(allergenes) {

    allergenesList.innerHTML = '';

    // Parcours des allergènes de la ddb pour les afficher dynamiquement
    allergenes.forEach(allergene => {

      // Création du conteneur
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-2 rounded';

      // Style
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      // Remplissage du contenue
      row.innerHTML = `
        <span class="fw-semibold">${allergene.libelle}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-danger btn-sm btn-delete" data-id="${allergene.id}" data-libelle="${allergene.libelle}" title="Supprimer">
            <i class="bi bi-trash-fill"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm btn-edit" data-id="${allergene.id}" data-libelle="${allergene.libelle}" title="Modifier">
            <i class="bi bi-pencil-fill"></i>
          </button>
        </div>
      `;

      // Ajout au DOM
      allergenesList.appendChild(row);
    });

    // ===== EVENTS MODALE SUPPRESSION =====
    // Attache les événements pour la suppresion 
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        // stock ID
        currentDeleteId = btn.dataset.id; 
        // nom affiché
        deleteAllergeneName.textContent = btn.dataset.libelle;
        // ouverture modal
        deleteModal.show();
      });
    });
    // ===== EVENTS MODALE MODIFICATION =====
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        currentEditId = btn.dataset.id;
        editLibelleInput.value = btn.dataset.libelle;
        editModal.show();
      });
    });

    if (DebugConsole) console.log("[renderAllergenes] Rendu de", allergenes.length, "allergènes");
  }

  /* ===============================
     RECUPERE LES ALLERGÈNES AVEC LES INFORMATONS PRESENTE EN DDB
     =============================== */
  async function loadAllergenes() {
    if (DebugConsole) console.log("[loadAllergenes] Appel GET", apiGetAllergenes);
    try {
      const response = await fetch(apiGetAllergenes, { method: 'GET', headers: authHeaders });

      if (!response.ok) {
        console.error("[loadAllergenes] Erreur status :", response.status);
        return;
      }

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[loadAllergenes] Données reçues :", data);

      if (data.allergenes && Array.isArray(data.allergenes)) {
        renderAllergenes(data.allergenes);
      }
    } catch (err) {
      console.error('[loadAllergenes] Erreur :', err);
    }
  }
  loadAllergenes();

   /* ===============================
     AJOUT ALLERGÈNE
     =============================== */
  // On écoute le clic sur le bouton "Ajouter"
  btnAdd.addEventListener('click', async () => {
    // On récupère la valeur de l'input + suppression des espaces inutiles
    const libelle = newAllergeneInput.value.trim();

    // Vérification : si le champ est vide
    if (!libelle) {
      showToast("Veuillez entrer un nom d'allergène.", "error");
      return;
    }

    if (DebugConsole) console.log("[addAllergene] POST", apiEmployeAllergenes, { libelle });
    // Requête POST pour ajouter un allergène

    try {
      const response = await fetch(apiEmployeAllergenes, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ libelle })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[addAllergene] Réponse :", response.status, data);

      if (response.ok) {
        showToast("Allergène ajouté avec succès !");
        newAllergeneInput.value = '';
        loadAllergenes();
      } else {
        showToast(data.message || "Erreur lors de l'ajout.", "error");
      }
    } catch (err) {
      console.error('[addAllergene] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

  /* ===============================
     SUPPRESSION ALLERGÈNE (MODALE)
     =============================== */
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentDeleteId) return;

    const url = `${apiEmployeAllergenes}/${currentDeleteId}`;
    if (DebugConsole) console.log("[deleteAllergene] DELETE", url);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Allergène supprimé !");
        loadAllergenes(); //recharge la liste des allegènes
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deleteAllergene] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
    // Fermeture de la modale
    deleteModal.hide();
    // Reset de l'ID
    currentDeleteId = null;
  });

  /* ===============================
     MODIFICATION ALLERGÈNE (MODALE)
     =============================== */
  // On écoute le bouton de confirmation dans la modale d'édition
  confirmEditBtn.addEventListener('click', async () => {
    // Sécurité : si aucun ID sélectionné on arrete 
    if (!currentEditId) return;

    // Récupération du nouveau libellé
    const libelle = editLibelleInput.value.trim();
    if (!libelle) {
      showToast("Le libellé ne peut pas être vide.", "error");
      return;
    }

    const url = `${apiEmployeAllergenes}/${currentEditId}`;
    if (DebugConsole) console.log("[updateAllergene] PUT", url, { libelle });

    // Requête PUT(update) pour modifier l'allergène
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ libelle })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Allergène modifié avec succès !");
        loadAllergenes(); // Recharge liste
      } else {
        showToast(data.message || "Erreur lors de la modification.", "error");
      }
    } catch (err) {
      console.error('[updateAllergene] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    // Fermeture de la modale
    editModal.hide();

    // Reset ID
    currentEditId = null;
  });

}