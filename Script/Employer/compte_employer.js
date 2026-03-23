import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCompteEmployerPage() {

  /* ===============================
      SCRIPT PAGE COMMANDES employer
     =============================== */
  
  // Variable debug console : passer à false pour désactiver tous les logs
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération des commandes de l'API Symfony
  const apiCommandesUrl = `${API_URL}/api/employer/commandes`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL :", API_URL);
    console.log("apiMeUrl :", apiMeUrl);
    console.log("apiCommandesUrl :", apiCommandesUrl);
    console.log("========================");
  }

  /* ===============================
      RECUPERATION DES INFOS UTILISATEURS
     =============================== */

  // Récupère le token JWT depuis le cookie (géré par script.js)
  const token = getToken();

  if (!token) {
    console.error('Pas de token, impossible de charger les commandes');
    return;
  }

  if (DebugConsole) {
    console.log("=== DEBUG INIT COMPTE employer ===");
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
      MAPPING DES STATUTS
        - 1.  Les clés correspondent exactement aux valeurs retournées par le back Symfony
        - 2.  label : texte affiché dans le badge
        - 3.  css : classe CSS pour la couleur du badge
     =============================== */

  const STATUS_MAP = {
    'En attente':                    { label: 'En attente',                 css: 'compte_employer-status-pending' },
    'Acceptée':                      { label: 'Acceptée',                   css: 'compte_employer-status-accepted' },
    'En préparation':                { label: 'En préparation',             css: 'compte_employer-status-preparing' },
    'En livraison':                  { label: 'En livraison',               css: 'compte_employer-status-delivering' },
    'Livré':                         { label: 'Livré',                      css: 'compte_employer-status-delivering' },
    'En attente de retour matériel': { label: 'En attente retour matériel', css: 'compte_employer-status-pending' },
    'Terminée':                      { label: 'Terminée',                   css: 'compte_employer-status-completed' },
    'Annulée':                       { label: 'Annulée',                    css: 'compte_employer-status-cancelled' }
  };

 /* ===============================
      INJECTION DE LA MODALE D'AVIS DANS LE DOM
        - 1.  Insérée une seule fois au chargement de la page
        - 2.  Contient : sélecteur de note 1-5 étoiles + textarea description
        - 3.  Réutilisée pour chaque commande via data-commande-id
    =============================== */

  function injectAvisModal() {
    // Vérifie que la modale n'existe pas déjà
    if (document.getElementById('modal-avis')) {
      if (DebugConsole) console.log("[injectAvisModal] Modale déjà présente dans le DOM");
      return;
    }

    const modalHtml = `
      <div class="modal fade" id="modal-avis" tabindex="-1" aria-labelledby="modal-avis-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content" style="background: var(--cream-bg, #fdf8f0); border-radius: 16px; border: none;">
            
            <!-- Header de la modale -->
            <div class="modal-header" style="border-bottom: 1px solid #e8dfd4; padding: 1.25rem 1.5rem;">
              <h5 class="modal-title" id="modal-avis-label" style="font-family: 'Playfair Display', serif; font-weight: 600; color: #2c1810;">
                <i class="bi bi-chat-left-dots" style="color: #c8956c;"></i> Laisser un avis
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>

            <!-- Corps de la modale -->
            <div class="modal-body" style="padding: 1.5rem;">

              <!-- Nom du menu concerné -->
              <p id="modal-avis-menu" style="font-weight: 500; color: #5a4a3a; margin-bottom: 1rem;"></p>

              <!-- Sélecteur de note (étoiles cliquables) -->
              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-weight: 500; color: #5a4a3a; margin-bottom: 0.5rem;">
                  Votre note
                </label>
                <div id="modal-avis-stars" style="display: flex; gap: 6px; cursor: pointer;">
                  <i class="bi bi-star" data-note="1" style="font-size: 1.75rem; color: #d4c5b0; transition: color 0.2s;"></i>
                  <i class="bi bi-star" data-note="2" style="font-size: 1.75rem; color: #d4c5b0; transition: color 0.2s;"></i>
                  <i class="bi bi-star" data-note="3" style="font-size: 1.75rem; color: #d4c5b0; transition: color 0.2s;"></i>
                  <i class="bi bi-star" data-note="4" style="font-size: 1.75rem; color: #d4c5b0; transition: color 0.2s;"></i>
                  <i class="bi bi-star" data-note="5" style="font-size: 1.75rem; color: #d4c5b0; transition: color 0.2s;"></i>
                </div>
                <input type="hidden" id="modal-avis-note" value="0">
              </div>

              <!-- Zone de texte pour la description -->
              <div style="margin-bottom: 1rem;">
                <label for="modal-avis-description" style="display: block; font-weight: 500; color: #5a4a3a; margin-bottom: 0.5rem;">
                  Votre commentaire <small style="color: #9a8a7a;">(255 caractères max)</small>
                </label>
                <textarea 
                  id="modal-avis-description" 
                  maxlength="255" 
                  rows="4" 
                  placeholder="Décrivez votre expérience..."
                  style="width: 100%; border: 1px solid #d4c5b0; border-radius: 10px; padding: 0.75rem; font-size: 0.95rem; resize: vertical; background: #fff; color: #2c1810;"
                ></textarea>
                <small id="modal-avis-char-count" style="color: #9a8a7a; float: right;">0 / 255</small>
              </div>

              <!-- Message d'erreur -->
              <div id="modal-avis-error" style="display: none; color: #c0392b; font-size: 0.9rem; margin-bottom: 0.75rem;">
                <i class="bi bi-exclamation-circle"></i> <span></span>
              </div>

            </div>

            <!-- Footer de la modale -->
            <div class="modal-footer" style="border-top: 1px solid #e8dfd4; padding: 1rem 1.5rem;">
              <button type="button" class="btn" data-bs-dismiss="modal" style="color: #5a4a3a;">Annuler</button>
              <button type="button" id="modal-avis-submit" class="btn" style="background: #c8956c; color: #fff; border-radius: 8px; padding: 0.5rem 1.5rem; font-weight: 500;">
                <i class="bi bi-send"></i> Envoyer mon avis
              </button>
            </div>

            <!-- ID de la commande -->
            <input type="hidden" id="modal-avis-commande-id" value="">
          </div>
        </div>
      </div>
    `;

    // Injecte la modale dans le body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    if (DebugConsole) console.log("[injectAvisModal] Modale injectée dans le DOM");

    // ====== LISTENERS DE LA MODALE ======

    // Gestion des étoiles cliquables
    const starsContainer = document.getElementById('modal-avis-stars');
    const noteInput = document.getElementById('modal-avis-note');

    starsContainer.addEventListener('click', (e) => {
      const star = e.target.closest('[data-note]');
      if (!star) return;

      const note = parseInt(star.dataset.note);
      noteInput.value = note;

      // Met à jour l'affichage des étoiles
      starsContainer.querySelectorAll('i').forEach(s => {
        const starNote = parseInt(s.dataset.note);
        if (starNote <= note) {
          s.classList.remove('bi-star');
          s.classList.add('bi-star-fill');
          s.style.color = '#c8956c';
        } else {
          s.classList.remove('bi-star-fill');
          s.classList.add('bi-star');
          s.style.color = '#d4c5b0';
        }
      });

      if (DebugConsole) console.log(`[modal-avis] Note sélectionnée : ${note}`);
    });

    // Survol des étoiles (effet hover)
    starsContainer.addEventListener('mouseover', (e) => {
      const star = e.target.closest('[data-note]');
      if (!star) return;
      const hoverNote = parseInt(star.dataset.note);

      starsContainer.querySelectorAll('i').forEach(s => {
        const starNote = parseInt(s.dataset.note);
        if (starNote <= hoverNote) {
          s.style.color = '#c8956c';
        }
      });
    });

    // Fin du survol, retour à la note sélectionnée
    starsContainer.addEventListener('mouseout', () => {
      const currentNote = parseInt(noteInput.value);
      starsContainer.querySelectorAll('i').forEach(s => {
        const starNote = parseInt(s.dataset.note);
        if (starNote <= currentNote) {
          s.style.color = '#c8956c';
        } else {
          s.style.color = '#d4c5b0';
        }
      });
    });

    // Compteur de caractères sur la description
    const descriptionInput = document.getElementById('modal-avis-description');
    const charCount = document.getElementById('modal-avis-char-count');

    descriptionInput.addEventListener('input', () => {
      charCount.textContent = `${descriptionInput.value.length} / 255`;
    });

    // Bouton d'envoi de l'avis
    const submitBtn = document.getElementById('modal-avis-submit');
    submitBtn.addEventListener('click', () => submitAvis());
  }

  /* ===============================
      FONCTION : OUVRIR LA MODALE D'AVIS
        - Réinitialise les champs
        - Renseigne l'ID de la commande et le nom du menu
        - Ouvre la modale Bootstrap
     =============================== */

  function openAvisModal(commandeId, menuTitre) {
    if (DebugConsole) console.log(`[openAvisModal] Ouverture pour commande ${commandeId} (${menuTitre})`);

    // Réinitialise les champs
    document.getElementById('modal-avis-note').value = '0';
    document.getElementById('modal-avis-description').value = '';
    document.getElementById('modal-avis-char-count').textContent = '0 / 255';
    document.getElementById('modal-avis-commande-id').value = commandeId;
    document.getElementById('modal-avis-menu').textContent = `Commande : ${menuTitre}`;

    // Réinitialise les étoiles
    document.querySelectorAll('#modal-avis-stars i').forEach(s => {
      s.classList.remove('bi-star-fill');
      s.classList.add('bi-star');
      s.style.color = '#d4c5b0';
    });

    // Cache le message d'erreur
    const errorDiv = document.getElementById('modal-avis-error');
    errorDiv.style.display = 'none';

    // Ouvre la modale Bootstrap
    const modalEl = document.getElementById('modal-avis');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  /* ===============================
      FONCTION : SOUMETTRE L'AVIS
        - Valide les champs (note 1-5, description non vide)
        - Appelle POST /api/employer/commandes/{id}/avis
        - Corps JSON : { "note": 5, "description": "..." }
        - Ferme la modale et recharge les commandes si succès
     =============================== */

  async function submitAvis() {
    const commandeId = document.getElementById('modal-avis-commande-id').value;
    const note = parseInt(document.getElementById('modal-avis-note').value);
    const description = document.getElementById('modal-avis-description').value.trim();
    const errorDiv = document.getElementById('modal-avis-error');
    const errorSpan = errorDiv.querySelector('span');

    if (DebugConsole) console.log(`[submitAvis] Commande ${commandeId} - Note: ${note}, Description: "${description}"`);

    // Validation côté front
    if (note < 1 || note > 5) {
      errorSpan.textContent = 'Veuillez sélectionner une note entre 1 et 5 étoiles.';
      errorDiv.style.display = 'block';
      if (DebugConsole) console.log("[submitAvis] Erreur : note invalide");
      return;
    }

    if (!description || description.length === 0) {
      errorSpan.textContent = 'Veuillez écrire un commentaire.';
      errorDiv.style.display = 'block';
      if (DebugConsole) console.log("[submitAvis] Erreur : description vide");
      return;
    }

    if (description.length > 255) {
      errorSpan.textContent = 'Le commentaire ne doit pas dépasser 255 caractères.';
      errorDiv.style.display = 'block';
      if (DebugConsole) console.log("[submitAvis] Erreur : description trop longue");
      return;
    }

    // Cache l'erreur
    errorDiv.style.display = 'none';

    const url = `${apiCommandesUrl}/${commandeId}/avis`;
    if (DebugConsole) console.log(`[submitAvis] Appel POST ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          note: note,
          description: description
        })
      });

      const result = await response.json();

      if (DebugConsole) {
        console.log(`[submitAvis] Réponse status :`, response.status);
        console.log(`[submitAvis] Réponse body :`, result);
      }

      if (response.ok) {
        // Ferme la modale
        const modalEl = document.getElementById('modal-avis');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Message de succès
        alert(result.message || 'Avis soumis avec succès !');
        if (DebugConsole) console.log(`[submitAvis] Avis soumis avec succès, rechargement...`);

        // Recharge les commandes pour afficher le nouvel avis
        loadOrders();

      } else {
        // Affiche l'erreur retournée par l'API dans la modale
        errorSpan.textContent = result.message || 'Erreur lors de l\'envoi de l\'avis.';
        errorDiv.style.display = 'block';
        if (DebugConsole) console.log(`[submitAvis] Erreur API :`, result.message);
      }

    } catch (err) {
      console.error('[submitAvis] Erreur réseau :', err);
      errorSpan.textContent = 'Erreur réseau, veuillez réessayer.';
      errorDiv.style.display = 'block';
    }
  }

  /* ===============================
      AFFICHAGE DU PRÉNOM DANS LE HERO
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

      const data = await response.json();
      if (DebugConsole) console.log("[loadUserName] Données reçues :", data);

      const heroName = document.getElementById('hero-user-name');
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

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // Conteneur où les cards de commande seront injectées dynamiquement
  const commandesList = document.getElementById('commandes-list');

  /* ===============================
      FONCTION : CHARGER LES COMMANDES DEPUIS L'API
        - 1.  Appelle GET /api/employer/commandes
        - 2.  Le back filtre automatiquement les commandes du employer connecté grâce au token JWT
        - 3.  Réponse attendue : { status: "Succès", total: X, commandes: [...] }
    =============================== */

  async function loadOrders() {
    if (DebugConsole) console.log("[loadOrders] Début - Appel GET", apiCommandesUrl);

    try {
      const response = await fetch(apiCommandesUrl, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log("[loadOrders] Réponse status :", response.status);

      if (!response.ok) {
        console.error('[loadOrders] Erreur chargement commandes:', response.status);
        if (commandesList) {
          commandesList.innerHTML = '<p class="text-center text-muted">Erreur lors du chargement des commandes.</p>';
        }
        return;
      }

      const data = await response.json();
      const orders = data.commandes || [];

      // Stockage global pour filtrage AJAX
      allOrders = orders;

      if (DebugConsole) {
        console.log("[loadOrders] Données reçues :", data);
        console.log("[loadOrders] Nombre de commandes :", orders.length);
        orders.forEach((o, i) => console.log(`[loadOrders] Commande ${i} :`, o));
      }

      applyFilters();

    } catch (err) {
      console.error('[loadOrders] Erreur réseau :', err);
      if (commandesList) {
        commandesList.innerHTML = '<p class="text-center text-muted">Erreur réseau, veuillez réessayer.</p>';
      }
    }
  }

  /* ===============================
      FILTRE AJAX DES COMMANDES
        - Filtre par numéro de commande
        - Filtre par statut
     =============================== */
  function applyFilters() {

    if (DebugConsole) console.log("[applyFilters] Application des filtres");

    const searchInput = document.getElementById('search-order');
    const statusSelect = document.getElementById('filter-status');

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusValue = statusSelect ? statusSelect.value : '';

    if (DebugConsole) {
      console.log("[applyFilters] Recherche :", searchValue);
      console.log("[applyFilters] Statut :", statusValue);
    }

    // Filtrage des commandes
    const filteredOrders = allOrders.filter(order => {

      let matchSearch = true;
      let matchStatus = true;

      // ===== FILTRE RECHERCHE =====
      if (searchValue !== '') {

        const numero = (order.numero_commande || '').toLowerCase();

        matchSearch = numero.includes(searchValue);
      }

      // ===== FILTRE STATUT =====
      if (statusValue !== '') {

        matchStatus = order.statut === statusValue;

      }

      return matchSearch && matchStatus;

    });

    if (DebugConsole) {
      console.log("[applyFilters] Commandes après filtre :", filteredOrders.length);
    }

    // Réaffiche les commandes filtrées
    renderOrders(filteredOrders);

  }

  /* ===============================
      LISTENERS DES FILTRES
     =============================== */

  function initFilters() {

    const searchInput = document.getElementById('search-order');
    const statusSelect = document.getElementById('filter-status');
    const resetBtn = document.getElementById('reset-filters');

    if (DebugConsole) console.log("[initFilters] Initialisation des filtres");

    // ===== Recherche numéro commande =====
    if (searchInput) {

      searchInput.addEventListener('input', () => {

        if (DebugConsole) console.log("[initFilters] Recherche saisie :", searchInput.value);

        applyFilters();

      });

    }

    // ===== Filtre statut =====
    if (statusSelect) {

      statusSelect.addEventListener('change', () => {

        if (DebugConsole) console.log("[initFilters] Statut sélectionné :", statusSelect.value);

        applyFilters();

      });

    }

    // ===== Reset filtres =====
    if (resetBtn) {

      resetBtn.addEventListener('click', () => {

        if (DebugConsole) console.log("[initFilters] Reset filtres");

        if (searchInput) searchInput.value = '';
        if (statusSelect) statusSelect.value = '';

        applyFilters();

      });

    }

  }


  /* ===============================
      FONCTION : CHARGER LE SUIVI D'UNE COMMANDE
        - 1.  Appelle GET /api/employer/commandes/{id}/suivi
        - 2.  Réponse attendue : { status, total, suivis: [{ statut, date_statut }] }
     =============================== */
  async function loadSuivi(commandeId) {
    const url = `${apiCommandesUrl}/${commandeId}/suivi`;
    if (DebugConsole) console.log(`[loadSuivi] Début - Appel GET ${url}`);

    try {
      const response = await fetch(`${apiCommandesUrl}/${commandeId}/suivi`, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log(`[loadSuivi] Commande ${commandeId} - Réponse status :`, response.status);

      if (!response.ok) {
        if (DebugConsole) console.log(`[loadSuivi] Commande ${commandeId} - Réponse non OK, retourne []`);
        return [];
      }

      const data = await response.json();
      const suivis = data.suivis || [];

      if (DebugConsole) console.log(`[loadSuivi] Commande ${commandeId} - ${suivis.length} étapes :`, suivis);

      return suivis;

    } catch (err) {
      console.error(`[loadSuivi] Commande ${commandeId} - Erreur :`, err);
      return [];
    }
  }

  /* ===============================
      FONCTION : GÉNÉRER LES CARDS DE COMMANDE
        - Crée une card HTML pour chaque commande
        - Chaque card contient :
            1.  Titre du menu en gras + badge statut à droite
            2.  Numéro commande — date prestation à heure
            3.  Ligne d'infos : Personnes | Livraison | Réduction | Total
            4.  Timeline de suivi (badges horizontaux)
            5.  Section avis déposé (si commande terminée + avis existant)
            6.  Section prêt de matériel (si en attente de restitution)
            7.  Bouton Annuler (si commande en attente)
     =============================== */

  async function renderOrders(orders) {
    if (!commandesList) {
      if (DebugConsole) console.log("[renderOrders] commandesList non trouvé, abandon");
      return;
    }

    if (DebugConsole) console.log("[renderOrders] Début - Rendu de", orders.length, "commandes");

    // Vide le conteneur avant de le remplir
    commandesList.innerHTML = '';

    // Si aucune commande
    if (orders.length === 0) {
      commandesList.innerHTML = '<p class="text-center text-muted">Vous n\'avez aucune commande pour le moment.</p>';
      if (DebugConsole) console.log("[renderOrders] Aucune commande à afficher");
      return;
    }

    // Crée une card pour chaque commande
    for (const order of orders) {
      if (DebugConsole) console.log(`[renderOrders] Traitement commande ${order.id} (${order.numero_commande}) - Statut: ${order.statut}`);

      const card = document.createElement('div');
      card.className = 'compte_employer-order-card';

      // Récupère le statut et ses propriétés CSS pour le badge
      const status = STATUS_MAP[order.statut] || { label: order.statut, css: 'compte_employer-status-pending' };
      if (DebugConsole) console.log(`[renderOrders] Commande ${order.id} - Status mappé :`, status);

      // Charge le suivi de la commande depuis l'API
      const suivis = await loadSuivi(order.id);

      // Génère les sections HTML conditionnelles
      const timelineHtml = renderTimeline(suivis);
      const avisHtml = renderAvis(order);
      const materialHtml = renderMaterial(order);
      const cancelHtml = renderCancelButton(order);

      if (DebugConsole) {
        console.log(`[renderOrders] Commande ${order.id} - Timeline HTML :`, timelineHtml ? 'OUI' : 'VIDE');
        console.log(`[renderOrders] Commande ${order.id} - Avis HTML :`, avisHtml ? 'OUI' : 'VIDE');
        console.log(`[renderOrders] Commande ${order.id} - Matériel HTML :`, materialHtml ? 'OUI' : 'VIDE');
        console.log(`[renderOrders] Commande ${order.id} - Annuler HTML :`, cancelHtml ? 'OUI' : 'VIDE');
      }

      // ====== CALCULS D'AFFICHAGE ======

      // Total = prix_menu + prix_livraison
      const total = ((order.prix_menu || 0) + (order.prix_livraison || 0)).toFixed(2);

      // Livraison : "Gratuite" si 0€, sinon le montant
      const livraisonText = order.prix_livraison > 0 ? order.prix_livraison.toFixed(2) + '€' : 'Gratuite';

      // Réduction : si reduction_montant > 0 on affiche "-XX€", sinon "—"
      let reductionText = '—';
      let reductionClass = '';
      if (order.reduction_montant && order.reduction_montant > 0) {
        reductionText = `-${order.reduction_montant}€`;
        reductionClass = 'compte_employer-order-info-value-reduction';
      }

      // Heure de livraison (si disponible) : " à 19:30"
      const heureText = order.heure_livraison ? ` à ${order.heure_livraison}` : '';

      if (DebugConsole) {
        console.log(`[renderOrders] Commande ${order.id} - Total: ${total}€, Livraison: ${livraisonText}, Réduction: ${reductionText}, Heure: ${heureText}`);
      }

      // ====== CONSTRUCTION DU HTML DE LA CARD ======
      card.innerHTML = `
        <!-- En-tête : titre du menu + badge statut -->
        <div class="compte_employer-order-header">
          <h3 class="compte_employer-order-menu-name">${order.menu_titre || '—'}</h3>
          <span class="compte_employer-order-status ${status.css}">${status.label}</span>
        </div>

        <!-- Numéro commande — date prestation à heure -->
        <p class="compte_employer-order-ref">
          ${order.numero_commande || '—'} — ${order.date_prestation || ''}${heureText}
        </p>

        <!-- Ligne d'infos : Personnes | Livraison | Réduction | Total -->
        <div class="compte_employer-order-infos">
          <div class="compte_employer-order-info-item">
            <span class="compte_employer-order-info-label">Personnes</span>
            <span class="compte_employer-order-info-value">${order.nombre_personne || 0}</span>
          </div>
          <div class="compte_employer-order-info-item">
            <span class="compte_employer-order-info-label">Livraison</span>
            <span class="compte_employer-order-info-value">${livraisonText}</span>
          </div>
          <div class="compte_employer-order-info-item">
            <span class="compte_employer-order-info-label">Réduction</span>
            <span class="compte_employer-order-info-value ${reductionClass}">${reductionText}</span>
          </div>
          <div class="compte_employer-order-info-item">
            <span class="compte_employer-order-info-label">Total</span>
            <span class="compte_employer-order-info-value compte_employer-order-info-value-total">${total}€</span>
          </div>
        </div>

        <!-- Timeline de suivi -->
        ${timelineHtml}

        <!-- Section avis (si commande terminée + avis existant) -->
        ${avisHtml}

        <!-- Section prêt de matériel (si applicable) -->
        ${materialHtml}

        <!-- Bouton annuler (si commande en attente) -->
        ${cancelHtml}
      `;

      commandesList.appendChild(card);
      if (DebugConsole) console.log(`[renderOrders] Commande ${order.id} - Card injectée dans le DOM`);
    }

    // Branche les listeners sur les boutons annuler après injection dans le DOM
    setupCancelButtons();

    // Branche les listeners sur les boutons "Laisser un avis"
    setupAvisButtons();
    if (DebugConsole) console.log("[renderOrders] Terminé - Tous les listeners branchés");
  }

  /* ===============================
      FONCTION : GÉNÉRER LA TIMELINE DE SUIVI
        - 1.  Affiche les étapes de la commande sous forme de badges horizontaux
        - 2.  Chaque badge contient : statut + date
          Chaque suivi : { statut: "En attente", date_statut: "10/01/2026 10:00" }
     =============================== */
  function renderTimeline(suivis) {
    // Si pas de timeline, on n'affiche rien
    if (!suivis || suivis.length === 0) {
      if (DebugConsole) console.log("[renderTimeline] Aucun suivi, section vide");
      return '';
    }

    if (DebugConsole) console.log("[renderTimeline] Génération de", suivis.length, "badges");

    // Génère un badge par étape
    const badgesHtml = suivis.map(step => {
      const stepStatus = STATUS_MAP[step.statut] || { label: step.statut };
      if (DebugConsole) console.log(`[renderTimeline] Badge : ${stepStatus.label} — ${step.date_statut}`);
      return `<span class="compte_employer-timeline-badge">${stepStatus.label} — ${step.date_statut || ''}</span>`;
    }).join('');

    return `
      <div class="compte_employer-order-timeline-label">
        <i class="bi bi-clock-history"></i>
        <span>Suivi (du plus ancien au plus récent)</span>
      </div>
      <div class="compte_employer-order-timeline">
        ${badgesHtml}
      </div>
    `;
  }

  /* ===============================
      FONCTION : GÉNÉRER LA SECTION AVIS
        - 1.  Si commande "Terminée" + avis existant, on affiche "Avis déposé (statut)"
        - 2.  Si commande "Terminée" + pas d'avis on affiche le bouton "Laisser un avis"
        - 3.  Sinon on fait rien
    =============================== */
  function renderAvis(order) {
    // Si la commande n'est pas terminée pas de section avis
    if (order.statut !== 'Terminée') {
      if (DebugConsole) console.log(`[renderAvis] Commande ${order.id} - Statut "${order.statut}" != "Terminée", pas d'avis`);
      return '';
    }

    // Si un avis existe déjà pour cette commande, affiche le statut
    if (order.avis) {
      let avisStatutText = '';
      switch (order.avis.statut) {
        case 'validé':
          avisStatutText = 'Validé';
          break;
        case 'en_attente':
          avisStatutText = 'En attente de validation';
          break;
        case 'refusé':
          avisStatutText = 'Refusé';
          break;
        default:
          avisStatutText = order.avis.statut;
      }

      if (DebugConsole) console.log(`[renderAvis] Commande ${order.id} - Avis trouvé, statut: ${avisStatutText}, note: ${order.avis.note}`);

      return `
        <div class="compte_employer-order-review">
          <i class="bi bi-chat-left-dots"></i>
          <span>Avis déposé (${avisStatutText})</span>
        </div>
      `;
    }

    // Pas d'avis déposé on affiche le bouton "Laisser un avis"
    if (DebugConsole) console.log(`[renderAvis] Commande ${order.id} - Terminée mais pas d'avis, affichage bouton`);

    return `
      <button type="button" class="btn btn-compte_employer-avis" data-commande-id="${order.id}" data-menu-titre="${order.menu_titre || ''}">
        <i class="bi bi-chat-left-dots"></i> Laisser un avis
      </button>
    `;
  }

  /* ===============================
      FONCTION : BRANCHER LES LISTENERS SUR LES BOUTONS "LAISSER UN AVIS"
        Au clic on ouvre la modale d'avis pré-remplie avec l'ID commande et le nom du menu
     =============================== */

  function setupAvisButtons() {
    const avisButtons = commandesList.querySelectorAll('.btn-compte_employer-avis');

    if (DebugConsole) console.log("[setupAvisButtons] Nombre de boutons avis trouvés :", avisButtons.length);

    avisButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const commandeId = btn.dataset.commandeId;
        const menuTitre = btn.dataset.menuTitre;

        if (DebugConsole) console.log(`[setupAvisButtons] Clic "Laisser un avis" - Commande ${commandeId} (${menuTitre})`);

        openAvisModal(commandeId, menuTitre);
      });
    });
  }

  /* ===============================
      FONCTION : GÉNÉRER LA SECTION PRÊT DE MATÉRIEL
        - 1.  Affichée uniquement si etat_materiel === 'ATTENTE_RESTITUTION'
        - 2.  Utilise le champ etat_materiel retourné par getEtatMateriel() côté back
        Valeurs possibles : 'TERMINEE', 'ATTENTE_RESTITUTION', 'INCOHERENT'
     =============================== */
  function renderMaterial(order) {
    if (DebugConsole) console.log(`[renderMaterial] Commande ${order.id} - etat_materiel: ${order.etat_materiel}`);

    // Si la commande n'inclut pas de matériel, on n'affiche rien
   if (!order.etat_materiel || order.etat_materiel === 'TERMINEE') {
      if (DebugConsole) console.log(`[renderMaterial] Commande ${order.id} - Pas de matériel ou terminé, section vide`);
      return '';
    }

    // Détermine le statut de restitution matériel si présent on affiche la card matériel
    if (order.etat_materiel === 'ATTENTE_RESTITUTION') {
      if (DebugConsole) console.log(`[renderMaterial] Commande ${order.id} - Matériel en attente de restitution, affichage card`);
      return `
        <div class="compte_employer-material-card">
          <div class="compte_employer-material-title">
            <i class="bi bi-box-seam"></i>
            <span>Prêt de matériel</span>
          </div>
          <p class="compte_employer-material-status">
            Statut restitution : <span class="compte_employer-material-status-pending">✗ En attente de restitution</span>
          </p>
          <p class="compte_employer-material-info">
            Pour restituer le matériel, contactez-nous par email avec le sujet "Restitution matériel".
          </p>
        </div>
      `;
    }

    return '';
  }

  /* ===============================
      FONCTION : GÉNÉRER LE BOUTON ANNULER
        - 1.  Affiché uniquement si la commande est en statut "En attente"
        - 2.  Le clic déclenchera une demande de motif puis l'appel API
     =============================== */
  function renderCancelButton(order) {
    // Le bouton annuler n'apparaît que si la commande est "En attente"
    if (order.statut !== 'En attente') {
      if (DebugConsole) console.log(`[renderCancelButton] Commande ${order.id} - Statut "${order.statut}" != "En attente", pas de bouton`);
      return '';
    }

    if (DebugConsole) console.log(`[renderCancelButton] Commande ${order.id} - Bouton annuler généré`);

    return `
      <button type="button" class="btn btn-compte_employer-cancel" data-order-id="${order.id}">
        <i class="bi bi-x-circle"></i> Annuler
      </button>
    `;
  }

  /* ===============================
      FONCTION : BRANCHER LES LISTENERS SUR LES BOUTONS ANNULER
        - 1.  Au clic : demande le motif (obligatoire côté back)
        - 2.  Appelle POST /api/employer/commandes/{id}/annuler
        - 3.  Corps JSON : { "motif_annulation": "..." }
        - 4.  Recharge la liste après annulation réussie
     =============================== */
  function setupCancelButtons() {
    // Sélectionne tous les boutons annuler dans le conteneur
    const cancelButtons = commandesList.querySelectorAll('.btn-compte_employer-cancel');

    if (DebugConsole) console.log("[setupCancelButtons] Nombre de boutons annuler trouvés :", cancelButtons.length);

    cancelButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        // Récupère l'ID de la commande depuis l'attribut data-order-id
        const orderId = btn.dataset.orderId;
        if (!orderId) return;

        if (DebugConsole) console.log(`[setupCancelButtons] Clic annuler sur commande ${orderId}`);

        // Demande confirmation à l'utilisateur
        const confirmed = confirm(
          'Êtes-vous sûr de vouloir annuler cette commande ?\n' +
          'Cette action est irréversible.'
        );
        if (!confirmed) {
          if (DebugConsole) console.log(`[setupCancelButtons] Commande ${orderId} - Annulation refusée par l'utilisateur`);
          return;
        }

        // Demande le motif d'annulation à l'utilisateur (obligatoire)
        const motif = prompt(
          'Veuillez indiquer le motif d\'annulation :\n(Ce champ est obligatoire)'
        );

        // Si l'utilisateur annule le prompt ou ne saisit rien
        if (!motif || motif.trim() === '') {
          alert('Le motif d\'annulation est obligatoire.');
          if (DebugConsole) console.log(`[setupCancelButtons] Commande ${orderId} - Motif vide, abandon`);
          return;
        }

        if (DebugConsole) console.log(`[setupCancelButtons] Commande ${orderId} - Motif: "${motif.trim()}"`);

        const url = `${apiCommandesUrl}/${orderId}/annuler`;
        if (DebugConsole) console.log(`[setupCancelButtons] Appel POST ${url}`);

        try {
          // Appel API : POST /api/employer/commandes/{id}/annuler
          const response = await fetch(url, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ motif_annulation: motif.trim() })
          });

          const result = await response.json();

          if (DebugConsole) {
            console.log(`[setupCancelButtons] Commande ${orderId} - Réponse status :`, response.status);
            console.log(`[setupCancelButtons] Commande ${orderId} - Réponse body :`, result);
          }

          if (response.ok) {
            // Affiche le message de remboursement retourné par l'API
            alert(result.message || 'Commande annulée.');
            if (DebugConsole) console.log(`[setupCancelButtons] Commande ${orderId} - Annulée avec succès, rechargement...`);
            // Recharge la liste des commandes pour afficher le nouveau statut
            loadOrders();
          } else {
            alert(result.message || 'Impossible d\'annuler cette commande.');
            if (DebugConsole) console.log(`[setupCancelButtons] Commande ${orderId} - Erreur API :`, result.message);
          }

        } catch (err) {
          console.error(`[setupCancelButtons] Commande ${orderId} - Erreur réseau :`, err);
          alert('Erreur réseau, veuillez réessayer.');
        }
      });
    });
  }

  /* ===============================
      INITIALISATION
        - 1. Injecte la modale d'avis dans le DOM
        - 2. Charge le prénom dans le hero
        - 3. Charge les commandes du employer depuis l'API
     =============================== */
  if (DebugConsole) console.log("=== INITIALISATION PAGE COMPTE employer ===");
  injectAvisModal();
  loadUserName();
  initFilters();
  loadOrders();
}