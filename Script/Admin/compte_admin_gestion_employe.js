import { API_URL } from '../config.js';
import {getToken, sanitizeInput, sanitizeHtml } from '../script.js';

export function initCompteAdminGestionEmployePage() {
  
  /* ===============================
      SCRIPT PAGE ADMIN GESTION EMPLOYEE
     =============================== */
  
  // Variable debug console : passer à false pour désactiver tous les logs
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API de récupération de l'ensemble des utilisateurs
  const apiGetUtilisateurs = `${API_URL}/api/admin/utilisateurs`;

  // EndPoint de l'API de création des employées
  const apiCreateEmploye = `${API_URL}/api/admin/employes`;

  // EndPoint de l'API de gestion admin utilisateur
  const apiAdminUtilisateurs = `${API_URL}/api/admin/utilisateurs`;
  
  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL              :", API_URL);
    console.log("apiMeUrl             :", apiMeUrl);
    console.log("apiGetUtilisateurs   :", apiGetUtilisateurs);
    console.log("apiCreateEmploye     :", apiCreateEmploye);
    console.log("apiAdminUtilisateurs :", apiAdminUtilisateurs);    
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

  // Liste des emmployée présent en BDD
  const employesList = document.getElementById('employes-list');

  // Formulaire création
  const inputNom = document.getElementById('employe-nom');
  const inputPrenom = document.getElementById('employe-prenom');
  const inputEmail = document.getElementById('employe-email');
  const inputTelephone = document.getElementById('employe-telephone');
  const btnCreate = document.getElementById('btn-create-employe');

  // Modal suppression
  const deleteModalEl = document.getElementById('deleteEmployeModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteEmployeName = document.getElementById('delete-employe-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete-employe');

  // Toast
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Variables
  let allEmployes = [];
  let currentDeleteId = null;

  /* ===============================
      FONCTION : TOAST D'AFFICHAGE BOOTSTRAP
     =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = sanitizeHtml(message || "Action effectuée !");
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
        const prenom = sanitizeHtml(data.utilisateur.prenom || data.utilisateur.email || '');
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
      FONCTION : CHARGEMENT DE LA LIST DES EMPLOYÉS
        - Appel GET /api/admin/utilisateurs
          retourne que les utilisateurs avec le role == 'ROLE_EMPLOYE'
     =============================== */
  async function loadEmployes() {
    if (DebugConsole) console.log("[loadEmployes] Appel GET", apiGetUtilisateurs);
    try {
      const response = await fetch(apiGetUtilisateurs, { method: 'GET', headers: authHeaders });
      if (!response.ok) {
        console.error("[loadEmployes] Erreur :", response.status);
        if (DebugConsole) console.log("[loadEmployes] Erreur chargement APi", apiGetUtilisateurs);
        return;
      }
      let data = [];
      try { data = await response.json(); } catch { data = []; }
      if (DebugConsole) console.log("[loadEmployes] Accès API réussi", apiGetUtilisateurs);

      // Filtre uniquement les employés
      allEmployes = data.filter(function(u) {
        return u.role === 'ROLE_EMPLOYE';
      });

      if (DebugConsole) console.log("[loadEmployes] Employés trouvés :", allEmployes.length);
      renderEmployes(allEmployes);
    } catch (err) {
      console.error('[loadEmployes] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : AFFICHER LES EMPLOYÉS
     =============================== */
  function renderEmployes(employes) {
    if (!employesList) return;
    employesList.innerHTML = '';

    if (employes.length === 0) {
      employesList.innerHTML = '<p class="text-center text-muted">Aucun employé trouvé.</p>';
      return;
    }

    employes.forEach(function(employe) {
      if (DebugConsole) console.log("[renderEmployes] :", employe.prenom, employe.nom, employe.statut_compte);
      const prenom = sanitizeHtml(employe.prenom || '');
      const nom = sanitizeHtml(employe.nom || '');
      const email = sanitizeHtml(employe.email || '');
      const telephone = sanitizeHtml(employe.telephone || '');
      const isActif = employe.statut_compte === 'actif';

      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-3 rounded';
      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      row.innerHTML = `
        <div>
          <strong>${prenom} ${nom}</strong>
          <span class="badge ms-2 ${isActif ? 'bg-success' : 'bg-warning text-dark'}">${isActif ? 'Actif' : 'Désactivé'}</span>
          <br>
          <small class="text-muted">${email}</small>
          ${telephone ? '<br><small class="text-muted">' + telephone + '</small>' : ''}
        </div>
        <div class="d-flex flex-column gap-2">
          ${isActif
            ? `<button class="btn btn-warning btn-sm  btn-desactiver" data-id="${employe.id}" title="Désactiver">
                <i class="bi bi-pause-circle me-1"></i> Désactiver
               </button>`
            : `<button class="btn btn-success btn-sm  btn-reactiver" data-id="${employe.id}" title="Réactiver">
                <i class="bi bi-play-circle me-1"></i> Réactiver
               </button>`
          }
          <button class="btn btn-danger btn-sm  btn-supprimer" 
            data-id="${employe.id}" 
            data-nom="${prenom} ${nom}" 
            title="Supprimer">
            <i class="bi bi-trash me-1"></i> Supprimer
          </button>
        </div>
      `;

      employesList.appendChild(row);
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
        deleteEmployeName.textContent = btn.dataset.nom;
        deleteModal.show();
      });
    });
  }

  /* ===============================
      FONCTION : DÉSACTIVER / RÉACTIVER UN EMPLOYÉ OU UN UTILISATEUR
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
        loadEmployes();
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
      SUPPRIMER UN EMPLOYÉ VIA MODALE
        - APPEL : DELETE /api/admin/utilisateurs/{id}
     =============================== */
  confirmDeleteBtn.addEventListener('click', async function() {
    if (!currentDeleteId) return;

    const url = `${apiAdminUtilisateurs}/${currentDeleteId}`;
    if (DebugConsole) console.log("[deleteEmploye] DELETE", url);

    try {
      const response = await fetch(url, { method: 'DELETE', headers: authHeaders });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Employé supprimé !");
        loadEmployes();
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deleteEmploye] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    deleteModal.hide();
    currentDeleteId = null;
  });

 /* ===============================
      CRÉER UN EMPLOYÉ
        - APPEL : POST /api/admin/employes
          Données fixes pour l'employée : pays, ville, adresse, code_postal
    =============================== */
  btnCreate.addEventListener('click', async function() {

    const nom = sanitizeInput(inputNom.value.trim());
    const prenom = sanitizeInput(inputPrenom.value.trim());
    const email = sanitizeInput(inputEmail.value.trim());
    const telephone = sanitizeInput(inputTelephone.value.trim());

    // Validations
    if (!nom) { showToast("Le nom est obligatoire.", "error"); return; }
    if (!prenom) { showToast("Le prénom est obligatoire.", "error"); return; }
    if (!email) { showToast("L'email est obligatoire.", "error"); return; }
    if (!telephone) { showToast("Le téléphone est obligatoire.", "error"); return; }

    const telephoneValid=validatePhone(telephone);

    // Validation téléphone 
    if(!telephoneValid){
      showToast("Le telephone n'est pas valide.", "error");
      return;
    }

    const emailValid = validateEmail(email);

    // Validation email 
    if (!emailValid) {
      showToast("L'email n'est pas valide.", "error");
      return;
    }

    const body = {
      nom: nom,
      prenom: prenom,
      email: email,
      telephone: telephone,
      pays: 'France',
      ville: 'Bordeaux',
      adresse_postale: '22 quai des Chartrons',
      code_postal: '33000'
    };

    if (DebugConsole) console.log("[createEmploye] POST", apiCreateEmploye, body);

    try {
      const response = await fetch(apiCreateEmploye, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (DebugConsole) console.log("[createEmploye] Réponse :", response.status, data);

      if (response.ok) {
        showToast("Compte employé créé ! Un email a été envoyé.");
        // Reset les champs
        inputNom.value = '';
        inputPrenom.value = '';
        inputEmail.value = '';
        inputTelephone.value = '';
        // Recharge la liste
        loadEmployes();
      } else {
        showToast(data.message || "Erreur lors de la création.", "error");
      }
    } catch (err) {
      console.error('[createEmploye] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

  /* ===============================
      INITIALISATION
     =============================== */
  loadEmployes();
}
