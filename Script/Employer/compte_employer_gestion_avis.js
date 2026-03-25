import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initGestionAvisEmployerPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION AVIS
     =============================== */
  
  // Variable debug console
  let DebugConsole = false;

  let allAvis = [];

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération de tous les avis.
  const apiGetAvis = `${API_URL}/api/employe/avis`;

  // EndPoint de l'API pour Approuver / Refuser les avis
  const apiEmployeAvis = `${API_URL}/api/employe/avis`;

  // EndPoint de l'API pour Supprimer un avis
  const apiAdminAvis = `${API_URL}/api/admin/avis`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL        :", API_URL);
    console.log("apiMeUrl       :", apiMeUrl);
    console.log("apiGetAvis     :", apiGetAvis);
    console.log("apiEmployeAvis :", apiEmployeAvis);
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

  // Barre de recherche et filtres
  const searchInput = document.getElementById('search-order'); 
  // input texte pour rechercher un menu/commande
  const filterStatus = document.getElementById('filter-status'); 
  // select pour filtrer par statut
  const resetFiltersBtn = document.getElementById('reset-filters'); 
  // bouton pour réinitialiser les filtres

  // Liste des avis client
  const avisList = document.getElementById('commandes-list');

  // toast
  const toastEl = document.getElementById('toast-message');
  let toastBootstrap = null;
  if (toastEl) {
    toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });
  }

  /* ===============================
      FONCTION : TOAST
     =============================== */
  function showToast(message, type = 'success') {
    if (!toastEl || !toastBootstrap) return;
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
      try { data = await response.json(); } catch { data = {}; }

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
      FONCTION : CHARGER TOUS LES AVIS
        - APPEL : GET /api/admin/avis
     =============================== */
  async function loadAvis() {
    if (DebugConsole) console.log("[loadAvis] Appel GET", apiGetAvis);
    try {
      const response = await fetch(apiGetAvis, { method: 'GET', headers: authHeaders });
      if (!response.ok) {
        console.error("[loadAvis] Erreur :", response.status);
        return;
      }
      let result = {};
      try { result = await response.json(); } catch { result = {}; }

      allAvis = result.data || [];
      if (DebugConsole) console.log("[loadAvis] Avis chargés :", allAvis.length);
      applyFilters();
    } catch (err) {
      console.error('[loadAvis] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : AFFICHER LES AVIS
     =============================== */
  function renderAvis(avis) {
    if (!avisList) return;
    avisList.innerHTML = '';

    if (avis.length === 0) {
      avisList.innerHTML = '<p class="text-center text-muted">Aucun avis trouvé.</p>';
      return;
    }

    avis.forEach(function(a) {
      if (DebugConsole) console.log("[renderAvis] :", a.id, a.utilisateur_nom, a.statut);

      // Génération des étoiles
      let starsHtml = '';
      const note = a.note || 0;
      for (let i = 1; i <= 5; i++) {
        if (i <= note) {
          starsHtml += '<i class="bi bi-star-fill" style="color:#c8956c;"></i>';
        } else {
          starsHtml += '<i class="bi bi-star" style="color:#d4c5b0;"></i>';
        }
      }

      // Badge statut
            const statutLower = (a.statut || '').toLowerCase();
      let statutBadge = '';
      if (statutLower === 'validé' || statutLower === 'publié') {
        statutBadge = '<span class="badge bg-success ms-2">Validé</span>';
      } else if (statutLower === 'refusé') {
        statutBadge = '<span class="badge bg-danger ms-2">Refusé</span>';
      } else {
        statutBadge = '<span class="badge bg-warning text-dark ms-2">En attente</span>';
      }

      // Longueur description
      const descLength = (a.description || '').length;

      // Boutons d'action
      let actionsHtml = '';

      if (DebugConsole) console.log("[renderAvis] avis id:", a.id, "statut:", a.statut, "=== en_attente ?", a.statut === 'en_attente');

      // Valider / Refuser seulement si en_attente
      const statutNorm = (a.statut || '').toLowerCase().replace(/\s+/g, '_').replace('é', 'e');
      if (statutNorm === 'en_attente') {
        if (DebugConsole) console.log("[renderAvis] : boutons Valider/Refuser AFFICHÉS pour avis", a.id);
        actionsHtml += `
          <button class="btn btn-success btn-sm  btn-valider" data-id="${a.id}">
            <i class="bi bi-check-circle me-1"></i> Valider
          </button>
          <button class="btn btn-warning btn-sm  btn-refuser" data-id="${a.id}">
            <i class="bi bi-x-circle me-1"></i> Refuser
          </button>
        `;
      } else {
        if (DebugConsole) console.log("[renderAvis] : boutons Valider/Refuser MASQUÉS pour avis", a.id, "(statut:", a.statut, ")");
      }

      const card = document.createElement('div');
      card.className = 'p-4 mb-3 rounded';
      card.style.backgroundColor = '#fdf8f0';
      card.style.border = '1px solid #e8ddd0';

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong class="fs-5">${a.utilisateur_nom || 'Anonyme'}</strong>
            ${statutBadge}
            <br>
            <small class="text-muted">${a.date || '—'} — Commande ${a.numero_commande || '#' + (a.commande_id || '—')}</small>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${actionsHtml}
          </div>
        </div>
        <div class="mb-2">${starsHtml}</div>
        <p class="mb-1 fst-italic" style="color:#5a4a3a;">"${a.description || 'Aucun commentaire'}"</p>
        <small class="text-muted">${descLength}/255 caractères</small>
      `;

      avisList.appendChild(card);
    });

    // Events valider
    document.querySelectorAll('.btn-valider').forEach(function(btn) {
      btn.addEventListener('click', function() {
        changeAvisStatut(parseInt(btn.dataset.id), 'approuver');
      });
    });

    // Events refuser
    document.querySelectorAll('.btn-refuser').forEach(function(btn) {
      btn.addEventListener('click', function() {
        changeAvisStatut(parseInt(btn.dataset.id), 'refuser');
      });
    });

  }

  /* ===============================
      FONCTION : VALIDER OU REFUSER UN AVIS
        - APPEL : PUT /api/employe/avis/{id}/approuver
        - APPEL : PUT /api/employe/avis/{id}/refuser
     =============================== */  
  async function changeAvisStatut(avisId, action) {
    if (DebugConsole) console.log("[changeAvisStatut]", action, "avis id:", avisId);

    const url = `${apiEmployeAvis}/${avisId}/${action}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast(action === 'approuver' ? "Avis validé !" : "Avis refusé !");
        loadAvis();
      } else {
        showToast(data.message || "Erreur.", "error");
      }
    } catch (err) {
      console.error('[changeAvisStatut] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  }

  /* ===============================
      FONCTION : FILTRE RECHERCHE ET STATUT
     =============================== */  
  function applyFilters() {

    let search = "";
    let status = "";

    // Gestion du champ recherche
    if (searchInput) {
      if (searchInput.value) {
        search = searchInput.value.toLowerCase().trim();
      } else {
        search = "";
      }
    } else {
      search = "";
    }

    // Gestion du filtre status
    if (filterStatus) {
      if (filterStatus.value) {
        status = filterStatus.value;
      } else {
        status = "";
      }
    } else {
      status = "";
    }
    if (DebugConsole) console.log("[applyFilters] search:", search, "status:", status);

    const filtered = allAvis.filter(function(a) {

      // Filtre statut
      if (status) {
        const statutNorm = (a.statut || '').toLowerCase().replace(/\s+/g, '_').replace('é', 'e');
        const filterNorm = status.toLowerCase().replace(/\s+/g, '_').replace('é', 'e');
        if (statutNorm !== filterNorm) return false;
      }

      // Filtre recherche par nom utilisateur, description, id commande
      if (search) {
        const nom = (a.utilisateur_nom || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const cmdId = String(a.commande_id || '');
        if (!nom.includes(search) && !desc.includes(search) && !cmdId.includes(search)) return false;
      }

      return true;
    });

    renderAvis(filtered);
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
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      if (filterStatus) filterStatus.value = '';
      applyFilters();
    });
  }

  /* ===============================
      INITIALISATION
     =============================== */
  loadAvis();

}