import { API_URL } from '../config.js';
import {getToken, sanitizeInput, sanitizeHtml } from '../script.js';

export function initCompteAdminGestionUtilisateurPage() {
  
  /* ===============================
      SCRIPT PAGE ADMIN GESTION UTILISATEURS
     =============================== */
  
  // Variable debug console : passer à false pour désactiver tous les logs
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API de récupération de l'ensemble des utilisateurs
  const apiGetUtilisateurs = `${API_URL}/api/admin/utilisateurs`;

  // EndPoint de l'API de création des clients
  const apiCreateClient = `${API_URL}/api/admin/clients`;

  // EndPoint de l'API de gestion admin utilisateur
  const apiAdminUtilisateurs = `${API_URL}/api/admin/utilisateurs`;
  
  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL                   :", API_URL);
    console.log("apiMeUrl                  :", apiMeUrl);
    console.log("apiGetUtilisateurs        :", apiGetUtilisateurs);
    console.log("apiCreateClient           :", apiCreateClient);
    console.log("apiAdminUtilisateurs      :", apiAdminUtilisateurs);    
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
      console.log("=== DEBUG INIT COMPTE ADMIN ===");
      console.log("Cookies actuels :", document.cookie);
      console.log("Token actuel :", token);
      console.log("================================");
    }

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // Liste des utilisateurs présent en BDD
  const utilisateursList = document.getElementById('utilisateurs-list');

  // Formulaire création de l'utilisateurs 
  const inputNom = document.getElementById('utilisateur-nom');
  const inputPrenom = document.getElementById('utilisateur-prenom');
  const inputEmail = document.getElementById('utilisateur-email');
  const inputTelephone = document.getElementById('utilisateur-telephone');
  const inputAddress = document.getElementById('utilisateur-addresse');
  const inputCity = document.getElementById('utilisateur-ville');
  const inputPostal = document.getElementById('utilisateur-adresse-postal');
  const btnCreate = document.getElementById('btn-create-utilisateur');

  // Modal suppression utilisateurs
  const deleteModalEl = document.getElementById('deleteUtilisateurModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteUtilisateurName = document.getElementById('delete-utilisateur-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete-utilisateur');

  // Formulaire modification utilisateurs
  const editCard = document.getElementById('edit-utilisateur-card');
  const editTitle = document.getElementById('edit-utilisateur-title');
  const editPrenom = document.getElementById('edit-prenom');
  const editNom = document.getElementById('edit-nom');
  const editEmail = document.getElementById('edit-email');
  const editTelephone = document.getElementById('edit-telephone');
  const editAdresse = document.getElementById('edit-adresse');
  const editVille = document.getElementById('edit-ville');
  const editCodePostal = document.getElementById('edit-code-postal');
  const editRole = document.getElementById('edit-role');
  const btnSaveEdit = document.getElementById('btn-save-edit');
  const btnResetPassword = document.getElementById('btn-reset-password');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');

  // Toast
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Variables
  let allUtilisateur = [];
  let currentEditId = null;
  let currentDeleteId = null;

  /* ===============================
      FONCTION : TOAST D'AFFICHAGE BOOTSTRAP
     =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = message || "Action effectuée !";
    toastEl.classList.remove('toast-success', 'toast-error');
    toastEl.classList.add(type === 'error' ? 'toast-error' : 'toast-success');
    toastBootstrap.show();
  }

  /* ===============================
      FONCTIONS DE VALIDATION - TÉLÉPHONE
     =============================== */
  /**
   * Vérifie si le téléphone est valide
   * Doit commencer par 06, 07, +336 ou +337
   * Doit avoir exactement 10 chiffres
   */
  function validatePhone(phone) {
    // Enlève les espaces
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Vérifie le format: commence par 06, 07, +336 ou +337
    const startsCorrectly = /^(06|07|\+336|\+337)/.test(cleanPhone);
    
    // Vérifie qu'il y a exactement 10 chiffres au total
    const hasCorrectLength = cleanPhone.replace(/\D/g, '').length === 10;
    const valid =startsCorrectly && hasCorrectLength;

    if (DebugConsole) console.log(`validatePhone("${phone}"): `, valid);
    return valid;

  }
  /* ===============================
      FONCTIONS DE VALIDATION - EMAIL
     =============================== */
  /**
   * Vérifie si l'email est valide
   * Min 3 caractères avant @
   * Contient @
   * Min 3 caractères après @
   * Se termine par .fr ou .com
   */
  function validateEmail(email) {
    // Regex: min 3 char avant @, @ obligatoire, min 3 après, .fr ou .com obligatoire
    const emailRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9._-]{3,}\.(fr|com)$/;
    
    const valid = emailRegex.test(email);
    
    if (DebugConsole) console.log(`validateEmail("${email}") :`, valid);
    return valid;
  }

  /* ===============================
      FONCTIONS DE VALIDATION - TÉLÉPHONE
     =============================== */
  /**
   * Vérifie si le code postal est valide
   * Doit avoir exactement 5 chiffres
   */
  function validatePostalCode(postalCode) {
    // Vérifie qu'il contient exactement 5 chiffres
    const postalRegex = /^\d{5}$/;
    const valid = postalRegex.test(postalCode);
    if (DebugConsole) console.log(`validatePostalCode("${postalCode}") =>`, valid);
    return valid;
  }

  /* ===============================
      FONCTION : AFFICHAGE DU PRÉNOM DANS LE HERO
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
      FONCTION : CHARGEMENT DE LA LIST DES UTILISATEURS
        - Appel GET /api/admin/utilisateurs
          retourne que les utilisateurs avec le role == 'ROLE_CLIENT'
     =============================== */
  async function loadClient() {
    if (DebugConsole) console.log("[loadClient] Appel GET", apiGetUtilisateurs);
    try {
      const response = await fetch(apiGetUtilisateurs, { method: 'GET', headers: authHeaders });
      if (!response.ok) {
        console.error("[loadClient] Erreur :", response.status);
        if (DebugConsole) console.log("[loadClient] Erreur chargement APi", apiGetUtilisateurs);
        return;
      }
      let data = [];
      try { data = await response.json(); } catch { data = []; }
      if (DebugConsole) console.log("[loadClient] Accès API réussi", apiGetUtilisateurs);

      // Filtre uniquement les CLIENT
      allUtilisateur = data.filter(function(u) {
        return u.role === 'ROLE_CLIENT';
      });

      if (DebugConsole) console.log("[loadClient] Client trouvés :", allUtilisateur.length);
      renderClient(allUtilisateur);
    } catch (err) {
      console.error('[loadClient] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : AFFICHER LES CLIENT
     =============================== */
  function renderClient(clients) {
    if (!utilisateursList) return;
    utilisateursList.innerHTML = '';

    if (clients.length === 0) {
      utilisateursList.innerHTML = '<p class="text-center text-muted">Aucun client trouvé.</p>';
      return;
    }
    clients.forEach(function(c) {
      if (DebugConsole) console.log("[renderClient] :", c.prenom, c.nom, c.statut_compte);

      const isActif = c.statut_compte === 'actif';

      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-3 rounded';
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      row.innerHTML = `
        <div>
          <strong>${c.prenom || ''} ${c.nom || ''}</strong>
          <span class="badge ms-2 ${isActif ? 'bg-success' : 'bg-warning text-dark'}">${isActif ? 'Actif' : 'Désactivé'}</span>
          <br>
          <small class="text-muted">${c.email || ''} </small>
          ${c.telephone ? '<br><small class="text-muted">' + c.telephone + '</small>' : ''}
          ${c.ville ? '<br><small class="text-muted">' + c.adresse_postale +  " " + c.code_postal + " " + c.ville + '</small>' : ''}
        </div>
        <div class="d-flex flex-column gap-2">
          <button class="btn btn-secondary btn-sm btn-modifier" 
            data-id="${c.id}" title="Modifier">
            <i class="bi bi-pencil me-1"></i> Modifier
          </button>
          ${isActif
            ? '<button class="btn btn-warning btn-sm btn-desactiver" data-id="' + c.id + '" title="Désactiver"><i class="bi bi-pause-circle me-1"></i> Désactiver</button>'
            : '<button class="btn btn-success btn-sm btn-reactiver" data-id="' + c.id + '" title="Réactiver"><i class="bi bi-play-circle me-1"></i> Réactiver</button>'
          }
          <button class="btn btn-danger btn-sm btn-supprimer" 
            data-id="${c.id}" 
            data-nom="${c.prenom} ${c.nom}" 
            title="Supprimer">
            <i class="bi bi-trash me-1"></i> Supprimer
          </button>
        </div>
      `;

      utilisateursList.appendChild(row);
    });

    // Events désactiver
    document.querySelectorAll('.btn-desactiver').forEach(function(btn) {
      btn.addEventListener('click', function() {
        toggleStatut(parseInt(btn.dataset.id), 'desactivation');
      });
    });

    // Events réactiver
    document.querySelectorAll('.btn-reactiver').forEach(function(btn) {
      btn.addEventListener('click', function() {
        toggleStatut(parseInt(btn.dataset.id), 'reactivation');
      });
    });

    // Events supprimer
    document.querySelectorAll('.btn-supprimer').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentDeleteId = btn.dataset.id;
        deleteUtilisateurName.textContent = btn.dataset.nom;
        deleteModal.show();
      });
    });

    // Events modifier
    document.querySelectorAll('.btn-modifier').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openEditForm(parseInt(btn.dataset.id));
      });
    });

  }

  /* ===============================
      FONCTION : DÉSACTIVER / RÉACTIVER UN UTILISATEUR
        - APPEL : PUT /api/admin/utilisateurs/{id}/desactivation
        - APPEL : PUT /api/admin/utilisateurs/{id}/reactivation
     =============================== */
  async function toggleStatut(userId, action) {
    if (DebugConsole) console.log("[toggleStatut]", action, "id utilisateur:", userId);

    const url = `${apiAdminUtilisateurs}/${userId}/${action}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast(action === 'desactivation' ? "Compte désactivé !" : "Compte réactivé !");
        loadClient();
      } else {
        showToast(data.message || "Erreur lors du changement de statut.", "error");
        if (DebugConsole) console.log("[toggleStatut] Erreur chargement APi", apiGetUtilisateurs);
      }
    } catch (err) {
      console.error('[toggleStatut] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  }

  /* ===============================
      SUPPRIMER UN CLIENT VIA MODALE
        - APPEL : DELETE /api/admin/utilisateurs/{id}
     =============================== */
  confirmDeleteBtn.addEventListener('click', async function() {
    if (!currentDeleteId) return;

    const url = `${apiAdminUtilisateurs}/${currentDeleteId}`;
    if (DebugConsole) console.log("[deleteClient] DELETE", url);

    try {
      const response = await fetch(url, { method: 'DELETE', headers: authHeaders });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Client supprimé !");
        loadClient();
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deleteClient] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    deleteModal.hide();
    currentDeleteId = null;
  });

  /* ===============================
      FONCTION : OUVRIR LE FORMULAIRE DE MODIFICATION
     =============================== */
  function openEditForm(userId) {
    const user = allUtilisateur.find(function(u) { return u.id === userId; });
    if (!user) return;

    if (DebugConsole) console.log("[openEditForm] édition de :", user);

    currentEditId = userId;
    editTitle.textContent = 'Modifier — ' + (user.prenom || '') + ' ' + (user.nom || '');

    editPrenom.value = user.prenom || '';
    editNom.value = user.nom || '';
    editEmail.value = user.email || '';
    editTelephone.value = user.telephone || '';
    editAdresse.value = user.adresse_postale || '';
    editVille.value = user.ville || '';
    editCodePostal.value = user.code_postal || '';
    editRole.value = user.role || 'ROLE_CLIENT';

    editCard.classList.remove('d-none');
    editCard.scrollIntoView({ behavior: 'smooth' });
  }

  /* ===============================
      ANNULER LA MODIFICATION
     =============================== */
  btnCancelEdit.addEventListener('click', function() {
    editCard.classList.add('d-none');
    currentEditId = null;
  });

  /* ===============================
      ENREGISTRER LA MODIFICATION
        - APPEL : PUT /api/admin/utilisateurs/{id}
     =============================== */
  btnSaveEdit.addEventListener('click', async function() {
    if (!currentEditId) return;


    const prenom = sanitizeInput(editPrenom.value.trim());
    const nom = sanitizeInput(editNom.value.trim());
    const email = sanitizeInput(editEmail.value.trim());
    const telephone = sanitizeInput(editTelephone.value.trim());
    const adresse_postale = sanitizeInput(editAdresse.value.trim());
    const ville = sanitizeInput(editVille.value.trim());
    const code_postal = sanitizeInput(editCodePostal.value.trim());
    const role = sanitizeInput(editRole.value);

    // Validations
    if (!prenom) { showToast("Le prénom est obligatoire.", "error"); return; }
    if (!nom) { showToast("Le nom est obligatoire.", "error"); return; }
    if (!email) { showToast("L'email est obligatoire.", "error"); return; }
    if (!validateEmail(email)) { showToast("L'email n'est pas valide.", "error"); return; }
    if (!telephone) { showToast("Le téléphone est obligatoire.", "error"); return; }
    if (!validatePhone(telephone)) { showToast("Le téléphone n'est pas valide.", "error"); return; }

    const body = {
      prenom: prenom,
      email: email,
      telephone: telephone,
      ville: ville,
      adresse_postale: adresse_postale,
      code_postal:code_postal,
      role: role
    };

    const url = `${apiAdminUtilisateurs}/${currentEditId}`;
    if (DebugConsole) console.log("[saveEdit] PUT", url, body);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Utilisateur modifié avec succès !");
        editCard.classList.add('d-none');
        currentEditId = null;
        loadClient();
      } else {
        showToast(data.message || "Erreur lors de la modification.", "error");
      }
    } catch (err) {
      console.error('[saveEdit] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });


  /* ===============================
      CRÉER UN CLIENT
        - APPEL : POST /api/admin/employes
     =============================== */
  btnCreate.addEventListener('click', async function() {

    const nom = sanitizeInput(inputNom.value.trim());
    const prenom = sanitizeInput(inputPrenom.value.trim());
    const email = sanitizeInput(inputEmail.value.trim());
    const telephone = sanitizeInput(inputTelephone.value.trim());
    const addresse = sanitizeInput(inputAddress.value.trim());
    const ville = sanitizeInput(inputCity.value.trim());
    const code_postale = sanitizeInput(inputPostal.value.trim());

    // Validations vide ou non 
    if (!nom) { showToast("Le nom est obligatoire.", "error"); return; }
    if (!prenom) { showToast("Le prénom est obligatoire.", "error"); return; }
    if (!email) { showToast("L'email est obligatoire.", "error"); return; }
    if (!telephone) { showToast("Téléphone est obligatoire.", "error"); return; }
    if (!addresse) { showToast("L'addresse est obligatoire.", "error"); return; }
    if (!ville) { showToast("La ville est obligatoire.", "error"); return; }
    if (!code_postale) { showToast("Le code postale est obligatoire.", "error"); return; }

    // Deuxème validation Regex
    const emailValid = validateEmail(email);
    // Validation email 
    if (!emailValid) {
      showToast("L'email n'est pas valide.", "error");
      return;
    }

    const telephoneValid=validatePhone(telephone);
    // Validation téléphone 
    if(!telephoneValid){
      showToast("Le telephone n'est pas valide.", "error");
      return;
    }

    const body = {
      nom: nom,
      prenom: prenom,
      email: email,
      telephone: telephone,
      pays: 'France',
      ville: ville,
      adresse_postale: addresse,
      code_postal: code_postale,
    };

    if (DebugConsole) console.log("[createClient] POST", apiCreateClient, body);

    try {
      const response = await fetch(apiCreateClient, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[createClient] Réponse :", response.status, data);

      if (response.ok) {
        showToast("Compte client créé ! Un email a été envoyé.");
        // Reset les champs
        inputNom.value = '';
        inputPrenom.value = '';
        inputEmail.value = '';
        inputTelephone.value = '';
        inputAddress.value = '';
        inputCity.value = '';
        inputPostal.value = '';

        // Recharge la liste
        loadClient();
      } else {
        showToast(data.message || "Erreur lors de la création.", "error");
      }
    } catch (err) {
      console.error('[createClient] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

  /* ===============================
      RÉINITIALISER LE MOT DE PASSE TEMPORAIRE
        - APPEL : PUT /api/admin/utilisateurs/{id} avec { password: "true" }
     =============================== */
  btnResetPassword.addEventListener('click', async function() {
    if (!currentEditId) return;

    if (!confirm('Réinitialiser le mot de passe ? Un email avec le nouveau mot de passe temporaire sera envoyé.')) {
      return;
    }

    const url = `${apiAdminUtilisateurs}/${currentEditId}`;
    if (DebugConsole) console.log("[resetPassword] PUT", url);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ password: 'true' })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Mot de passe réinitialisé ! Email envoyé.");
      } else {
        showToast(data.message || "Erreur lors de la réinitialisation.", "error");
      }
    } catch (err) {
      console.error('[resetPassword] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

  /* ===============================
      INITIALISATION
     =============================== */
  loadClient();
}
