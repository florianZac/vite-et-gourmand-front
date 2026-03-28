import { API_URL } from '../config.js';
import { getToken, sanitizeInput, sanitizeHtml } from '../script.js';

export function initGestionCommandeEmployerPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION COMMANDE
     =============================== */
  
  // Variable debug console 
  let DebugConsole = false;
  let allCommandes = [];

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération de toutes les commandes
  const apiGetCommandes = `${API_URL}/api/commandes`;

  // EndPoint de l'API pour la récupération des status d'une commande
  const apiChangerStatut = `${API_URL}/api/employe/commandes`;

  // EndPoint de l'API pour la mise à jour des données de restitution retour matériel
  const apiRestitution = `${API_URL}/api/employe/commandes`;
  
  // EndPoint de l'API pour la gestion du suivis des commandes
  const apiSuivi = `${API_URL}/api/employe/commandes`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL          :", API_URL);
    console.log("apiMeUrl         :", apiMeUrl);
    console.log("apiGetCommandes  :", apiGetCommandes);
    console.log("apiChangerStatut :", apiChangerStatut);
    console.log("apiRestitution   :", apiRestitution);
    console.log("apiSuivi         :", apiSuivi);
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

  // Barre de recherche des commandes
  const searchInput = document.getElementById('search-order'); 

  // input texte pour rechercher une commande
  const filterStatus = document.getElementById('filter-status');

  // select pour filtrer par statut
  const resetFiltersBtn = document.getElementById('reset-filters'); 

  // Liste des commandes 
  const commandesList = document.getElementById('commandes-list'); 

  /* ===============================
      DOM MODALES
     =============================== */
  const modalStatutEl = document.getElementById('modalStatut');
  const modalStatutText = document.getElementById('modal-statut-text');
  const modalStatutId = document.getElementById('modal-statut-id');
  const modalStatutValue = document.getElementById('modal-statut-value');
  const modalStatutConfirm = document.getElementById('modal-statut-confirm');

  const modalRestitEl = document.getElementById('modalRestitution');
  const modalRestitMateriel = document.getElementById('modal-restit-materiel');
  const modalRestitPenalite = document.getElementById('modal-restit-penalite');
  const modalRestitId = document.getElementById('modal-restit-id');
  const modalRestitConfirm = document.getElementById('modal-restit-confirm');

  // Toast 
  const toastEl = document.getElementById('toast-message');
  let toastBootstrap = null;
  if (toastEl) {
    toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });
  }

  /* ===============================
      TOAST
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
      MAPPING STATUS DES DIFFERENTS ETATS D'UNE COMMANDE ET DE SON PROCHAIN STATUT
      Rappel : statut strict des commandes
      ->  En attente -> Acceptée -> En préparation -> En livraison -> Livré -> En attente de retour matériel -> Terminée  1er cas avec retour materiel
      |_> En attente -> Annulée
      
          ->  En attente -> Acceptée -> En préparation -> En livraison -> Livré -> Terminée  2ème cas SANS retour materiel
      |_> En attente -> Annulée
     =============================== */
  const NEXT_STATUS = {
    'En attente': 'Acceptée',
    'Acceptée': 'En préparation',
    'En préparation': 'En livraison',
    'En livraison': 'Livré'
  };
  const STATUS_CSS = {
    'En attente':                      'bg-warning text-dark',
    'Acceptée':                        'bg-info text-dark',
    'En préparation':                  'bg-primary',
    'En livraison':                    'bg-primary',
    'Livré':                           'bg-success',
    'En attente du retour matériel':   'bg-warning text-dark',
    'Terminée':                        'bg-success',
    'Annulée':                         'bg-danger'
  };
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
      FONCTION : CHARGER TOUTES LES COMMANDES
        APPEL GET /api/commandes/admin
     =============================== */
  async function loadCommandes() {
    if (DebugConsole) console.log("[loadCommandes] Appel GET", apiGetCommandes);
    try {
      const response = await fetch(apiGetCommandes, { method: 'GET', headers: authHeaders });
      if (!response.ok) {
        console.error("[loadCommandes] Erreur :", response.status);
        return;
      }
      let result = {};
      try { result = await response.json(); } catch { result = {}; }

      allCommandes = result.commandes || [];
      if (DebugConsole) console.log("[loadCommandes] result", result);
      if (DebugConsole) console.log("[loadCommandes] allCommandes", allCommandes);
      if (DebugConsole) console.log("[loadCommandes] Commandes chargées :", allCommandes.length);
      applyFilters();
    } catch (err) {
      console.error('[loadCommandes] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : CHARGER LE SUIVI D'UNE COMMANDE
     =============================== */
  async function loadSuivi(commandeId) {
    if (DebugConsole) console.log("[loadSuivi] Appel GET", apiSuivi);
    try {
      const response = await fetch(`${apiSuivi}/${commandeId}/suivi`, 
      { method: 'GET', headers: authHeaders });

      if (!response.ok){
        console.error('[loadSuivi] Erreur retour API :', err);
        return [];
      } 

      let data = {};
      try { 
        data = await response.json(); 
      } catch {
        data = {}; 
      }
      if (DebugConsole) console.log("[loadSuivi] data", data);
      return data.suivis || [];

    } catch (err) {

      console.error('[loadSuivi] Erreur :', err);
      return [];
    }
  }

  /* ===============================
    FONCTION : FORMATE LES DATES EN FR
    =============================== */
  function formatDateFR(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString.replace(' ', 'T'));
  return d.toLocaleDateString('fr-FR') + ' à ' +
         d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ===============================
    FONCTION : FORMATE LES HEURE EN FR
    =============================== */
  function formatHeureFR(dateString) {
  if (!dateString) return '';
    const d = new Date(dateString.replace(' ', 'T'));
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /* ===============================
      FONCTION : AFFICHER LES COMMANDES
     =============================== */
  async function renderCommandes(commandes) {
    if (DebugConsole) console.log("[renderCommandes] Appel");

    if (!commandesList) return;
    commandesList.innerHTML = '';

    if (commandes.length === 0) {
      commandesList.innerHTML = '<p class="text-center text-muted">Aucune commande trouvée.</p>';
      return;
    }

    for (const c of commandes) {
      if (DebugConsole) console.log("[renderCommandes] :", c.id, c.numero_commande, c.statut);

      const card = document.createElement('div');
      card.className = 'p-4 mb-3 rounded';
      card.style.backgroundColor = '#fdf8f0';
      card.style.border = '1px solid #e8ddd0';

      // Badge statut
      const badgeCss = STATUS_CSS[c.statut] || 'bg-secondary';

      // Prêt matériel
      const pretText = c.pret_materiel ? '<span style="color:#c0392b; font-weight:600;">Oui</span>' : '<span style="color:#5a4a3a;">Non</span>';

      // Restitution matériel
      let restituText = '<span style="color:#5a4a3a;">Non applicable</span>';
      if (c.pret_materiel) {
        restituText = c.restitution_materiel
          ? '<span style="color:green; font-weight:600;">Rendu</span>'
          : '<span style="color:#c0392b; font-weight:600;">en attente</span>';
      }

      // Total commande
      const total = ((c.prix_menu || 0) + (c.prix_livraison || 0)).toFixed(2);
      if (DebugConsole) console.log("[renderCommandes] total: ", total);
      if (DebugConsole) console.log("[renderCommandes] prix_menu: ", c.prix_menu);
      if (DebugConsole) console.log("[renderCommandes] prix_livraison: ", c.prix_livraison);
      // Boutons d'action
      let actionsHtml = '';

      // Bouton prochain statut
      const nextStatut = NEXT_STATUS[c.statut];
      if (nextStatut) {
        actionsHtml += `
          <button class="btn btn-secondary btn-sm btn-next-statut" 
            data-id="${c.id}" data-statut="${sanitizeHtml(nextStatut)}">
            ${sanitizeHtml(nextStatut)}
          </button>
        `;
      }

      // Bouton confirmer restitution si en attente de retour matériel
      if (c.statut === 'En attente du retour matériel') {
        actionsHtml += `
          <button class="btn btn-warning btn-sm btn-restitution" data-id="${c.id}">
            Confirmer restitution
          </button>
        `;
      }

      if (DebugConsole) console.log("[renderCommandes] COMMANDE COMPLETE :", c);
      // Suivi timeline
      const suivis = await loadSuivi(c.id);
      let suiviHtml = '';
      if (suivis.length > 0) {
        const badges = suivis.map(function(s) {
          return `<span class="badge bg-light text-dark border me-1 mb-2" style="font-size:0.75rem;">${sanitizeHtml(s.statut)} — ${sanitizeHtml(s.date_statut)}</span>`;
        }).join('');
        suiviHtml = `
          <div class="mt-2">
            <small class="text-muted-suivi pb-2" ><i class="bi bi-clock-history me-1"></i>Suivi :</small><br>
            ${badges}
          </div>
        `;
      }

      const date_cmd = formatDateFR(c.date_commande);
      const date_prestation = formatDateFR(c.date_prestation);
      
      if(c.prix_livraison == "")
      {
        c.prix_livraison = "Gratuite"
      }
      else{
        c.prix_livraison= c.prix_livraison +' €'
      }

      card.innerHTML = `
        <div class="text-center mb-2">
          <strong class="fs-5">${sanitizeHtml(c.numero_commande || '')}</strong><br>
          <em class="text-muted-commande">${sanitizeHtml(c.menu?.titre || c.menu_titre || '')}</em>
        </div>
        <div class="mb-2 client-info" style="font-size:0.9rem; color:#5a4a3a;">

          <strong>Nom du Client : </strong>
            <span class="client-name">
              ${sanitizeHtml(c.utilisateur_nom || c.utilisateur?.nom || '')}
            </span>
            <span class="prenom-name">
              ${sanitizeHtml(c.utilisateur_prenom || c.utilisateur?.prenom || '')}
            </span><br>
    
          <strong>Numero du Client : </strong>
            <span class="numero-name"> 
              ${sanitizeHtml(c.utilisateur?.telephone || '')}
            </span><br>
          <strong>Nombre de personnes : </strong> 
            <span class="nombre-personne-name"> 
              ${sanitizeHtml(c.nombre_personne || 0)} 
            </span><br>

          <strong>Date de commande : </strong>
            <span class="date-commande"> 
              ${sanitizeHtml(date_cmd ||  '')} 
            </span><br>

          <strong>Date de prestation client : </strong>
            <span class="date-prestation"> 
              ${sanitizeHtml(date_prestation  ||  '')}
            </span><br>

          <strong>Heure de livraison prévue : </strong>
            <span class="heure-livraison"> 
              ${sanitizeHtml(c.heure_livraison  ||  '')}
            </span><br>

          <strong>Ville de livraison : </strong>
            <span class="ville-livraison"> 
              ${sanitizeHtml(c.ville_livraison || ' ')}
            </span><br>         
          
          <strong>Adresse de livraison :</strong>
            <span class="adresse-livraison"> 
              ${sanitizeHtml(c.adresse_livraison || ' ')}
            </span><br>         
      
          <strong>Code postal du Client : </strong>
            <span class="codepostal-client"> 
              ${sanitizeHtml(c.utilisateur?.code_postal || '')}
            </span><br>    
          <strong>Distance entre le restaurant et le client : </strong>
            <span class="distance-livraison"> 
              ${sanitizeHtml(c.distance_km || '')} km
            </span><br>  
          <strong>Prix de la livraison : </strong>
            <span class="prix-livraison"> 
              ${sanitizeHtml(c.prix_livraison || '')} 
            </span><br>  
          <strong>Total commande TTC: </strong><span class="total-commande" >${sanitizeHtml(total)} €</span><br>
          <strong>Prêt matériel : </strong><span class="pret-mat" ${sanitizeHtml(pretText)}</span><br>
          <strong>Restitution matériel</strong><span class="resti-mat" ${sanitizeHtml(restituText)}</span><br>
        </div>
        <div class="mb-2">
          <span class="badge ${badgeCss}">${sanitizeHtml(c.statut)}</span>
        </div>
        ${suiviHtml}
        <div class="d-flex gap-2 mt-3">
          ${actionsHtml}
        </div>
      `;

      commandesList.appendChild(card);
    }

    // Events : prochain statut
    document.querySelectorAll('.btn-next-statut').forEach(function(btn) {
      btn.addEventListener('click', function() {
        ouvrirModalStatut(parseInt(btn.dataset.id), btn.dataset.statut);
      });
    });

    // Events : restitution
    document.querySelectorAll('.btn-restitution').forEach(function(btn) {
      btn.addEventListener('click', function() {
        ouvrirRestitution(parseInt(btn.dataset.id));
      });
    });
  } 

  /* ===============================
      FONCTION : OUVRIR MODALE CHANGEMENT STATUT
     =============================== */
  function ouvrirModalStatut(commandeId, nouveauStatut) {
    modalStatutText.textContent = `Passer la commande au statut "${nouveauStatut}" ?`;
    modalStatutId.value = commandeId;
    modalStatutValue.value = nouveauStatut;
    const modal = new bootstrap.Modal(modalStatutEl);
    modal.show();
  }

  /* ===============================
      LISTENER : CONFIRMER CHANGEMENT STATUT
      APPEL : POST /api/employe/commandes/{id}/statut
     =============================== */
  modalStatutConfirm.addEventListener('click', async function() {
    const commandeId = modalStatutId.value;
    const nouveauStatut = modalStatutValue.value;

    if (DebugConsole) console.log("[changerStatut] APPEL :", commandeId, ":", nouveauStatut);

    try {
      const response = await fetch(`${apiChangerStatut}/${commandeId}/statut`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ statut: nouveauStatut })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      const modal = bootstrap.Modal.getInstance(modalStatutEl);
      if (modal) modal.hide();

      if (response.ok) {
        showToast(data.message || "Statut mis à jour !");
        loadCommandes();
      } else {
        showToast(data.message || "Erreur.", "error");
      }
    } catch (err) {
      console.error('[changerStatut] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });


  /* ===============================
      FONCTION : OUVRIR MODALE RESTITUTION
     =============================== */
  function ouvrirRestitution(commandeId) {
    modalRestitId.value = commandeId;
    modalRestitMateriel.checked = true;
    modalRestitPenalite.checked = false;
    const modal = new bootstrap.Modal(modalRestitEl);
    modal.show();
  }

  /* ===============================
      LISTENER : CONFIRMER RESTITUTION
      APPEL : PUT /api/employe/commandes/{id}/restitution
     =============================== */
  modalRestitConfirm.addEventListener('click', async function() {
    const commandeId = modalRestitId.value;
    const restitution = modalRestitMateriel.checked;
    const penalite = modalRestitPenalite.checked;

    if (DebugConsole) console.log("[confirmerRestitution]", commandeId, "restit:", restitution, "penalite:", penalite);

    try {
      const response = await fetch(`${apiRestitution}/${commandeId}/restitution`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          restitution_materiel: restitution,
          penalite_payee: penalite
        })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      const modal = bootstrap.Modal.getInstance(modalRestitEl);
      if (modal) modal.hide();

      if (response.ok) {
        showToast(data.message || "Restitution confirmée !");
        loadCommandes();
      } else {
        showToast(data.message || "Erreur.", "error");
      }
    } catch (err) {
      console.error('[confirmerRestitution] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

  /* ===============================
      FONCTION : FILTRES RECHERCHER ET STATUS
     =============================== */
  function applyFilters() {
    const search = sanitizeInput(searchInput?.value.toLowerCase().trim() || '');
    const status = sanitizeInput(filterStatus?.value || '');

    const filtered = allCommandes.filter(function(c) {
      if (status && c.statut !== status) return false;

      if (search) {
        const numero = (c.numero_commande || '').toLowerCase();
        const nom = (c.utilisateur_nom || c.utilisateur?.nom || '').toLowerCase();
        const ville = (c.ville_livraison || '').toLowerCase();
        if (!numero.includes(search) && !nom.includes(search) && !ville.includes(search)) return false;
      }

      return true;
    });

    renderCommandes(filtered);
  }

  /* ===============================
      LISTENERS FILTRES
     =============================== */
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterStatus) filterStatus.addEventListener('change', applyFilters);
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
  loadUserName();
  loadCommandes();
}