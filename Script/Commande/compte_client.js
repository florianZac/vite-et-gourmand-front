import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCommandePage() {

  /* ===============================
    SCRIPT PAGE COMMANDES CLIENT
    Gère :
    1. L'affichage du prénom dans le hero via /api/me
    2. Le chargement des commandes du client via GET /api/client/commandes
    3. La génération dynamique des cards de commande
    4. La timeline de suivi via GET /api/client/commandes/{id}/suivi
    5. La section avis (si commande terminée + avis déposé)
    6. La section prêt de matériel (si applicable)
    7. Le bouton annuler via POST /api/client/commandes/{id}/annuler
    =============================== */
  
  // Variable debug console si à true
  let DebugConsole = true;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // URL de récupération des commandes de l'API Symfony
  const apiCommandesUrl = `${API_URL}/api/client/commandes`;

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
    console.log("=== DEBUG INIT COMPTE CLIENT ===");
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
    - Les clés correspondent exactement aux valeurs retournées par le back Symfony
    - label : texte affiché dans le badge
    - css : classe CSS pour la couleur du badge
  =============================== */

  const STATUS_MAP = {
    'En attente':                    { label: 'En attente',                 css: 'compte_client-status-pending' },
    'Acceptée':                      { label: 'Acceptée',                   css: 'compte_client-status-accepted' },
    'En préparation':                { label: 'En préparation',             css: 'compte_client-status-preparing' },
    'En livraison':                  { label: 'En livraison',               css: 'compte_client-status-delivering' },
    'Livré':                         { label: 'Livré',                      css: 'compte_client-status-delivering' },
    'En attente de retour matériel': { label: 'En attente retour matériel', css: 'compte_client-status-pending' },
    'Terminée':                      { label: 'Terminée',                   css: 'compte_client-status-completed' },
    'Annulée':                       { label: 'Annulée',                    css: 'compte_client-status-cancelled' }
  };

  /* ===============================
      AFFICHAGE DU PRÉNOM DANS LE HERO
      - 1. Appelle GET /api/me
      - 2. Décode le token JWT pour récupérer le prenom, nom, email, role
      - 3. Remplit le span #hero-user-name avec le prenom récuperer du token
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
      - Appelle GET /api/client/commandes
      - Le back filtre automatiquement les commandes du client connecté grâce au token JWT
      - Réponse attendue : { status: "Succès", total: X, commandes: [...] }
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

      if (DebugConsole) {
        console.log("[loadOrders] Données reçues :", data);
        console.log("[loadOrders] Nombre de commandes :", orders.length);
        orders.forEach((o, i) => console.log(`[loadOrders] Commande ${i} :`, o));
      }

      renderOrders(orders);

    } catch (err) {
      console.error('[loadOrders] Erreur réseau :', err);
      if (commandesList) {
        commandesList.innerHTML = '<p class="text-center text-muted">Erreur réseau, veuillez réessayer.</p>';
      }
    }
  }

 /* ===============================
    FONCTION : CHARGER LE SUIVI D'UNE COMMANDE
      - Appelle GET /api/client/commandes/{id}/suivi
      - Réponse attendue : { status, total, suivis: [{ statut, date_statut }] }
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
        1. Titre du menu en gras + badge statut à droite
        2. Numéro commande — date prestation à heure
        3. Ligne d'infos : Personnes | Livraison | Réduction | Total
        4. Timeline de suivi (badges horizontaux)
        5. Section avis déposé (si commande terminée + avis existant)
        6. Section prêt de matériel (si en attente de restitution)
        7. Bouton Annuler (si commande en attente)
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
      card.className = 'compte_client-order-card';

      // Récupère le statut et ses propriétés CSS pour le badge
      const status = STATUS_MAP[order.statut] || { label: order.statut, css: 'compte_client-status-pending' };
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
        reductionClass = 'compte_client-order-info-value-reduction';
      }

      // Heure de livraison (si disponible) : " à 19:30"
      const heureText = order.heure_livraison ? ` à ${order.heure_livraison}` : '';

      if (DebugConsole) {
        console.log(`[renderOrders] Commande ${order.id} - Total: ${total}€, Livraison: ${livraisonText}, Réduction: ${reductionText}, Heure: ${heureText}`);
      }

      // ====== CONSTRUCTION DU HTML DE LA CARD ======
      card.innerHTML = `
        <!-- En-tête : titre du menu + badge statut -->
        <div class="compte_client-order-header">
          <h3 class="compte_client-order-menu-name">${order.menu_titre || '—'}</h3>
          <span class="compte_client-order-status ${status.css}">${status.label}</span>
        </div>

        <!-- Numéro commande — date prestation à heure -->
        <p class="compte_client-order-ref">
          ${order.numero_commande || '—'} — ${order.date_prestation || ''}${heureText}
        </p>

        <!-- Ligne d'infos : Personnes | Livraison | Réduction | Total -->
        <div class="compte_client-order-infos">
          <div class="compte_client-order-info-item">
            <span class="compte_client-order-info-label">Personnes</span>
            <span class="compte_client-order-info-value">${order.nombre_personne || 0}</span>
          </div>
          <div class="compte_client-order-info-item">
            <span class="compte_client-order-info-label">Livraison</span>
            <span class="compte_client-order-info-value">${livraisonText}</span>
          </div>
          <div class="compte_client-order-info-item">
            <span class="compte_client-order-info-label">Réduction</span>
            <span class="compte_client-order-info-value ${reductionClass}">${reductionText}</span>
          </div>
          <div class="compte_client-order-info-item">
            <span class="compte_client-order-info-label">Total</span>
            <span class="compte_client-order-info-value compte_client-order-info-value-total">${total}€</span>
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
    if (DebugConsole) console.log("[renderOrders] Terminé - Tous les listeners annuler branchés");
  }


  /* ===============================
    FONCTION : GÉNÉRER LA TIMELINE DE SUIVI
      - 1.  Affiche les étapes de la commande sous forme de badges horizontaux
      - 2.  Chaque badge contient : statut + date
        Chaque suivi : { statut: "En attente", date_statut: "10/01/2026 10:00" }
    =============================== */

  function renderTimeline(timeline) {
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
      return `<span class="compte_client-timeline-badge">${stepStatus.label} — ${step.date_statut || ''}</span>`;
    }).join('');

    return `
      <div class="compte_client-order-timeline-label">
        <i class="bi bi-clock-history"></i>
        <span>Suivi (du plus ancien au plus récent)</span>
      </div>
      <div class="compte_client-order-timeline">
        ${badgesHtml}
      </div>
    `;
  }

  /* ===============================
    FONCTION : GÉNÉRER LA SECTION AVIS
      - 1.  Affichée uniquement si commande "Terminée" ET un avis existe
      - 2.  Utilise order.avis retourné par l'API : { id, note, statut }
       Statuts possibles : "validé", "en_attente", "refusé"
    =============================== */

function renderAvis(order) {

    // Si la commande n'est pas terminée, pas de section avis
    if (order.statut !== 'Terminée') {
      if (DebugConsole) console.log(`[renderAvis] Commande ${order.id} - Statut "${order.statut}" != "Terminée", pas d'avis`);
      return '';
    }

    // Si un avis existe pour cette commande
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

      // retourne le html formatée
      return `
        <div class="compte_client-order-review">
          <i class="bi bi-chat-left-dots"></i>
          <span>Avis déposé (${avisStatutText})</span>
        </div>
      `;
    }

    // Pas d'avis déposé, rien à afficher
    if (DebugConsole) console.log(`[renderAvis] Commande ${order.id} - Terminée mais pas d'avis déposé`);
    return '';
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
        <div class="compte_client-material-card">
          <div class="compte_client-material-title">
            <i class="bi bi-box-seam"></i>
            <span>Prêt de matériel</span>
          </div>
          <p class="compte_client-material-status">
            Statut restitution : <span class="compte_client-material-status-pending">✗ En attente de restitution</span>
          </p>
          <p class="compte_client-material-info">
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
      <button type="button" class="btn btn-compte_client-cancel" data-order-id="${order.id}">
        <i class="bi bi-x-circle"></i> Annuler
      </button>
    `;
  }

  /* ===============================
    FONCTION : BRANCHER LES LISTENERS SUR LES BOUTONS ANNULER
      - 1.  Au clic : demande le motif (obligatoire côté back)
      - 2.  Appelle POST /api/client/commandes/{id}/annuler
      - 3.  Corps JSON : { "motif_annulation": "..." }
      - 4.  Recharge la liste après annulation réussie
    =============================== */

  function setupCancelButtons() {
    // Sélectionne tous les boutons annuler dans le conteneur
    const cancelButtons = commandesList.querySelectorAll('.btn-compte_client-cancel');

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
          // Appel API : POST /api/client/commandes/{id}/annuler
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
      - 1. Charge le prénom dans le hero
      - 2. Charge les commandes du client depuis l'API
    =============================== */

  if (DebugConsole) console.log("=== INITIALISATION PAGE COMPTE CLIENT ===");
  loadUserName();
  loadOrders();
}