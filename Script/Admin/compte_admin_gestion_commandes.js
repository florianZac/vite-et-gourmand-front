import { API_URL } from '../config.js';
import {getToken, sanitizeInput, sanitizeHtml } from '../script.js';

export function initCompteAdminGestionCommandesPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION COMMANDE
     =============================== */
  
  // Variable debug console 
  let DebugConsole = true;
  let allCommandes = [];
  let renderVersion = 0;
  
  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération de toutes les commandes
  const apiGetCommandes = `${API_URL}/api/commandes`;

  // EndPoint de l'API pour la récupération des status d'une commande
  const apiChangerStatut = `${API_URL}/api/employe/commandes`;

  // EndPoint de l'API pour l'annulation d'une commande
  const apiAnnuler = `${API_URL}/api/commandes`;

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
    console.log("apiAnnuler       :", apiAnnuler);
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

  const modalAnnulerEl = document.getElementById('modalAnnuler');
  const modalAnnulerMotif = document.getElementById('modal-annuler-motif');
  const modalAnnulerCount = document.getElementById('modal-annuler-count');
  const modalAnnulerError = document.getElementById('modal-annuler-error');
  const modalAnnulerId = document.getElementById('modal-annuler-id');
  const modalAnnulerConfirm = document.getElementById('modal-annuler-confirm');

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
    body.textContent =sanitizeHtml( message || "Action effectuée !");
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
    'En livraison': 'Livré',
    'En attente du retour matériel':'Restitution confirmée'
  };

  const STATUS_CSS = {
    'En attente': 'bg-warning text-dark',
    'Acceptée': 'bg-info text-dark',
    'En préparation': 'bg-primary',
    'En livraison': 'bg-primary',
    'Livré': 'bg-success',
    'En attente du retour matériel': 'bg-warning text-dark',
    'Restitution confirmée': 'bg-success',
    'Terminée': 'bg-success',
    'Annulée': 'bg-danger'
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
        const prenom = data.utilisateur.prenom || data.utilisateur.email || '';
        heroUserName.textContent = sanitizeHtml(
          data.utilisateur.prenom || data.utilisateur.email || ''
        );
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
    if (DebugConsole) console.log("[loadSuivi] Appel GET", commandeId);
    const safeId = sanitizeInput(commandeId);
    try {
      const response = await fetch(`${apiSuivi}/${safeId}/suivi`, 
      { method: 'GET', headers: authHeaders });

      if (!response.ok){
        console.error('[loadSuivi] Erreur retour API :', response.status);
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
    renderVersion++;
    const currentVersion = renderVersion;

    commandesList.innerHTML = '';

    if (commandes.length === 0) {
      commandesList.innerHTML = '<p class="text-center text-muted">Aucune commande trouvée.</p>';
      return;
    }

    for (const c of commandes) {
      // Si un nouveau render a été lancé entre-temps, on arrête celui-ci
      if (currentVersion !== renderVersion) return;

      if (DebugConsole) console.log("[renderCommandes] :", c.id, c.numero_commande, c.statut);


      const numeroCommande = sanitizeHtml(c.numero_commande || '');
      const menuTitre = sanitizeHtml(c.menu?.titre || c.menu_titre || '');
      const nomClient = sanitizeHtml((c.utilisateur_nom || c.utilisateur?.nom || ''));
      const prenomClient = sanitizeHtml(c.utilisateur_prenom || c.utilisateur?.prenom || '');
      const telephone = sanitizeHtml(c.utilisateur?.telephone || '');
      const ville = sanitizeHtml(c.utilisateur?.ville || '');
      const adresse = sanitizeHtml(c.utilisateur?.adresse_postale || '');
      const CodePostal = sanitizeHtml(c.utilisateur?.code_postal || '');
      const ville_livraison = sanitizeHtml(c.ville_livraison || '');
      const adresse_livraison = sanitizeHtml(c.adresse_livraison || '');
      const CodePostal_livraison = sanitizeHtml(c.utilisateur?.code_postal || '');
      const safeId = sanitizeInput(c.id);
      const nb_personne = sanitizeInput(c.nombre_personne || 0);            
      const distance = sanitizeHtml(c.distance_km || '');
      const Heure_livraison = sanitizeHtml(c.heure_livraison  ||  '');
      const date_cmd = formatDateFR(c.date_commande);
      const date_prestation = formatDateFR(c.date_prestation);
      const prixLivraisonDisplay = (!c.prix_livraison || c.prix_livraison === 0) ? 'Gratuite' : c.prix_livraison + ' €';

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
          ? '<span style="color:green; font-weight:600;"> Rendu</span>'
          : '<span style="color:#c0392b; font-weight:600;"> En attente</span>';
      }

      // Total commande
      const total = (parseFloat(c.prix_menu) || 0) + (parseFloat(c.prix_livraison) || 0);
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
          <button class="btn btn-warning btn-sm btn-restitution" data-id="${safeId}">
            Confirmer restitution
          </button>
        `;
      }

      // Bouton annuler sauf Terminée et Annulée
      if (c.statut !== 'Terminée' && c.statut !== 'Annulée') {
        actionsHtml += `
          <button class="btn btn-danger btn-sm btn-annuler" data-id="${safeId}">
            Annuler
          </button>
        `;
      }
      if (DebugConsole) console.log("[renderCommandes] COMMANDE COMPLETE :", c);
      // Suivi timeline
      const suivis = await loadSuivi(safeId);
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

      card.innerHTML = `
        <div class="text-center mb-2">
          <strong class="fs-5">${numeroCommande}</strong><br>
          <em class="text-muted-commande">${menuTitre}</em>
        </div>
        <div class="mb-2 client-info" style="font-size:0.9rem; color:#5a4a3a;">

          <strong>Nom du Client : </strong>
            <span class="client-name">
              ${nomClient}
            </span>
            <span class="prenom-name">
              ${prenomClient}
            </span><br>
    
          <strong>Numero du Client : </strong>
            <span class="numero-name"> 
              ${telephone}
            </span><br>
          <strong>Nombre de personnes : </strong> 
            <span class="nombre-personne-name"> 
              ${nb_personne} 
            </span><br>

          <strong>Date de commande : </strong>
            <span class="date-commande"> 
              ${date_cmd} 
            </span><br>

          <strong>Date de prestation client : </strong>
            <span class="date-prestation"> 
              ${date_prestation  ||  ''}
            </span><br>

          <strong>Heure de livraison prévue : </strong>
            <span class="heure-livraison"> 
              ${Heure_livraison}
            </span><br>

          <strong>Adresse de facturation : </strong>
            <span class="adresse-livraison">
              ${adresse}
            </span><br>
          <strong>Ville de facturation : </strong>
            <span class="ville-livraison">
              ${ville}
            </span><br>
          <strong>Code postal facturation : </strong>
            <span class="codepostal-client">
              ${CodePostal}
            </span><br>

          <hr style="border-color:#e8ddd0; margin:0.5rem 0;">

          <strong>Adresse de livraison : </strong>
            <span class="adresse-livraison">
              ${adresse_livraison}
            </span><br>
          <strong>Ville de livraison : </strong>
            <span class="ville-livraison">
              ${ville_livraison}
            </span><br>
          <strong>Code postal livraison : </strong>
            <span class="codepostal-client">
              ${CodePostal_livraison}
            </span><br>  
          <strong>Distance entre le restaurant et le client : </strong>
            <span class="distance-livraison"> 
              ${distance} km
            </span><br>  
          <strong>Prix de la livraison : </strong>
            <span class="prix-livraison"> 
              ${sanitizeHtml(prixLivraisonDisplay)} 
            </span><br>  
          <strong>Total commande TTC: </strong><span class="total-commande">${total} €</span><br>
          <strong>Prêt matériel : </strong><span class="pret-mat">${pretText}</span><br>
          <strong>Restitution matériel : </strong><span class="resti-mat">${restituText}</span><br>
        </div>
        <div class="mb-2">
          <span class="badge ${badgeCss}">${c.statut}</span>
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

    // Events : annuler
    document.querySelectorAll('.btn-annuler').forEach(function(btn) {
      btn.addEventListener('click', function() {
        ouvrirAnnulation(parseInt(btn.dataset.id));
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
    modalStatutText.textContent = `Passer la commande au statut "${sanitizeInput(nouveauStatut)}" ?`;
    modalStatutId.value = sanitizeInput(commandeId);
    modalStatutValue.value = sanitizeInput(nouveauStatut);
    const modal = new bootstrap.Modal(modalStatutEl);
    modal.show();
  }

  /* ===============================
      LISTENER : CONFIRMER CHANGEMENT STATUT
      APPEL : POST /api/employe/commandes/{id}/statut
     =============================== */
  modalStatutConfirm.addEventListener('click', async function() {
    const commandeId = sanitizeInput(modalStatutId.value);
    const nouveauStatut = sanitizeInput(modalStatutValue.value);
    const originalText = modalStatutConfirm.innerHTML;

    if (DebugConsole) console.log("[changerStatut] APPEL :", commandeId, ":", nouveauStatut);

    // Désactive et met un spinner
    modalStatutConfirm.disabled = true;
    modalStatutConfirm.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2"></span>
      Changement statut en cours...
    `;

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

    // Réactive le bouton et remet le texte d’origine
    modalStatutConfirm.disabled = false;
    modalStatutConfirm.innerHTML = originalText;
  });

  /* ===============================
      FONCTION : OUVRIR MODALE ANNULATION
     =============================== */
  function ouvrirAnnulation(commandeId) {
    modalAnnulerId.value = commandeId;
    modalAnnulerMotif.value = '';
    modalAnnulerCount.textContent = '0 / 500';
    modalAnnulerError.style.display = 'none';
    const modal = new bootstrap.Modal(modalAnnulerEl);
    modal.show();
  }

  // Compteur caractères motif
  modalAnnulerMotif.addEventListener('input', function() {
    modalAnnulerCount.textContent = modalAnnulerMotif.value.length + ' / 500';
  });  

  /* ===============================
      LISTENER : ANNULER UNE COMMANDE
        APPEL : PUT /api/commandes/admin/{id}/annuler
     =============================== */
  modalAnnulerConfirm.addEventListener('click', async function() {

    const originalText = modalAnnulerConfirm.innerHTML;
    const commandeId = modalAnnulerId.value;
    const motif = modalAnnulerMotif.value.trim();

    if (!motif) {
      modalAnnulerError.style.display = 'block';
      return;
    }
    modalAnnulerError.style.display = 'none';

    if (DebugConsole) console.log("[annulerCommande]", commandeId, motif);

    // Désactive et met un spinner
    modalAnnulerConfirm.disabled = true;
    modalAnnulerConfirm.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2"></span>
      Annulation commande en cours...
    `;

    try {
      const response = await fetch(`${apiAnnuler}/${commandeId}/annuler`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ motif_annulation: motif })
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      const modal = bootstrap.Modal.getInstance(modalAnnulerEl);
      if (modal) modal.hide();

      if (response.ok) {
        showToast(data.message || "Commande Annulée !");
        loadCommandes();
      } else {
        showToast(data.message || "Erreur lors de l'annulation.", "error");
      }
    } catch (err) {
      console.error('[annulerCommande] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    // Réactive le bouton et remet le texte d’origine
    modalAnnulerConfirm.disabled = false;
    modalAnnulerConfirm.innerHTML = originalText;
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

    const originalText = modalRestitConfirm.innerHTML;
    const commandeId = sanitizeInput(modalRestitId.value);
    const restitution = sanitizeInput(modalRestitMateriel.checked);
    const penalite = sanitizeInput(modalRestitPenalite.checked);

    if (DebugConsole) console.log("[confirmerRestitution]", commandeId, "restit:", restitution, "penalite:", penalite);
    modalRestitConfirm.disabled = true;
    modalRestitConfirm.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2"></span>
      Restitution en cours...
    `;
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
    
    // Réactive le bouton et remet le texte d’origine
    modalRestitConfirm.disabled = false;
    modalRestitConfirm.innerHTML = originalText;
  });

  /* ===============================
      FONCTION : NETTOYAGE D'UN STRING POUR LE FILTRE
     =============================== */
  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ===============================
      FONCTION : FILTRES RECHERCHER ET STATUS
     =============================== */
  function applyFilters() {

    const search = searchInput
      ? normalize(searchInput.value)
      : '';

    const status = filterStatus
      ? normalize(filterStatus.value)
      : '';

    const filtered = allCommandes.filter(function(c) {

      const statutCommande = normalize(c.statut);

      // filtre statut
      if (status && statutCommande !== status) {
        return false;
      }

      // filtre recherche
      if (search) {
        const numero = normalize(c.numero_commande);
        const nom = normalize(c.utilisateur?.nom);
        const ville = normalize(c.ville_livraison);

        if (
          !numero.includes(search) &&
          !nom.includes(search) &&
          !ville.includes(search)
        ) return false;
      }

      return true;
    });

    console.log("RESULTAT FILTRE:", filtered.length);
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