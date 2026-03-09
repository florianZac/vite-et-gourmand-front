export function initCommandeClientPage() {

/* ===============================
  SCRIPT PAGE COMMANDES CLIENT
  Gère :
  1. L'affichage du prénom dans le hero
  2. Le chargement des commandes du client depuis l'API (GET)
  3. La génération dynamique des cards de commande
  4. La timeline de suivi de chaque commande
  5. La section prêt de matériel (si applicable)
  6. Le bouton annuler (si commande en attente)
  =============================== */

/* ===============================
    CONFIGURATION API
    =============================== */

const BASE_URL = 'http://127.0.0.1:8000/api';

// Récupère le token JWT pour l'authentification
const token = localStorage.getItem('token');

/* ===============================
    AFFICHAGE DU PRÉNOM DANS LE HERO
    - 1.  Décode le token JWT pour récupérer le prénom
    - 2.  Remplit le span #hero-user-name
    =============================== */

if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const firstName = payload.firstName || payload.prenom || payload.username || '';
    const heroName = document.getElementById('hero-user-name');
    if (heroName) heroName.textContent = firstName;
  } catch (err) {
    console.error('Erreur décodage token:', err);
  }
}

/* ===============================
    RÉCUPÉRATION DES ÉLÉMENTS DU DOM
   =============================== */

// Conteneur où les cards de commande seront injectées
const commandesList = document.getElementById('commandes-list');

/* ===============================
   MAPPING DES STATUTS
    - Associe chaque statut du back à :
      1. Un label en français
      2. Une classe CSS pour la couleur du badge
   =============================== */

const STATUS_MAP = {
  'en_attente':     { label: 'En attente',      css: 'commande_client-status-pending' },
  'acceptee':       { label: 'Acceptée',         css: 'commande_client-status-accepted' },
  'en_preparation': { label: 'En préparation',   css: 'commande_client-status-preparing' },
  'en_livraison':   { label: 'En livraison',     css: 'commande_client-status-delivering' },
  'terminee':       { label: 'Terminée',         css: 'commande_client-status-completed' },
  'annulee':        { label: 'Annulée',          css: 'commande_client-status-cancelled' }
};

/* ===============================
   FONCTION : CHARGER LES COMMANDES DEPUIS L'API
    - Appelle GET /api/orders (ou /api/me/orders selon ton API)
    - Le back filtre automatiquement les commandes du client connecté grâce au token JWT
   =============================== */

async function loadOrders() {
  if (!token) {
    console.error('Pas de token, impossible de charger les commandes');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Erreur chargement commandes:', response.status);
      return;
    }

    const data = await response.json();

    // Adapte selon la structure de ta réponse API
    const orders = data['hydra:member'] || data;

    console.log('✓ Commandes chargées:', orders.length);

    // Génère une card pour chaque commande
    renderOrders(orders);

  } catch (err) {
    console.error('Erreur réseau chargement commandes:', err);
  }
}

/* ===============================
   FONCTION : GÉNÉRER LES CARDS DE COMMANDE
    - Crée une card HTML pour chaque commande
    - Chaque card contient :
      1.  En-tête (nom du menu + badge statut)
      2.  Référence + date
      3.  Infos (personnes, livraison, réduction, total)
      4.  Timeline de suivi
      5.  Section avis (si commande terminée)
      6.  Section prêt matériel (si applicable)
      7.  Bouton annuler (si commande en attente)
   =============================== */

function renderOrders(orders) {
  if (!commandesList) return;

  // Vide le conteneur
  commandesList.innerHTML = '';

  // Si aucune commande
  if (orders.length === 0) {
    commandesList.innerHTML = '<p class="text-center text-muted">Vous n\'avez aucune commande pour le moment.</p>';
    return;
  }

  // Crée une card pour chaque commande
  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'commande_client-order-card';

    // Récupère le statut et ses propriétés CSS
    const status = STATUS_MAP[order.status] || { label: order.status, css: 'commande_client-status-pending' };

    // Génère le HTML de la timeline de suivi
    const timelineHtml = renderTimeline(order.timeline || []);

    // Génère le HTML de la section avis (si commande terminée et avis déposé)
    const reviewHtml = renderReview(order);

    // Génère le HTML de la section prêt de matériel (si applicable)
    const materialHtml = renderMaterial(order);

    // Génère le HTML du bouton annuler (si commande en attente)
    const cancelHtml = renderCancelButton(order);

    // Affichage de la réduction : tiret si pas de réduction, sinon le montant
    const reductionText = order.reduction ? `-${order.reduction}€` : '—';
    const reductionClass = order.reduction ? 'commande_client-order-info-value-reduction' : '';

    // Construit le HTML complet de la card
    card.innerHTML = `
      <!-- En-tête : nom du menu + badge statut -->
      <div class="commande_client-order-header">
        <h3 class="commande_client-order-menu-name">${order.menuName || '—'}</h3>
        <span class="commande_client-order-status ${status.css}">${status.label}</span>
      </div>

      <!-- Référence commande + date -->
      <p class="commande_client-order-ref">
        ${order.reference || '—'} — ${order.date || ''} à ${order.time || ''}
      </p>

      <!-- Ligne d'infos : personnes, livraison, réduction, total -->
      <div class="commande_client-order-infos">
        <div class="commande_client-order-info-item">
          <span class="commande_client-order-info-label">Personnes</span>
          <span class="commande_client-order-info-value">${order.persons || 0}</span>
        </div>
        <div class="commande_client-order-info-item">
          <span class="commande_client-order-info-label">Livraison</span>
          <span class="commande_client-order-info-value">${order.deliveryFee > 0 ? order.deliveryFee + '€' : 'Gratuite'}</span>
        </div>
        <div class="commande_client-order-info-item">
          <span class="commande_client-order-info-label">Réduction</span>
          <span class="commande_client-order-info-value ${reductionClass}">${reductionText}</span>
        </div>
        <div class="commande_client-order-info-item">
          <span class="commande_client-order-info-label">Total</span>
          <span class="commande_client-order-info-value commande_client-order-info-value-total">${order.total || 0}€</span>
        </div>
      </div>

      <!-- Timeline de suivi -->
      ${timelineHtml}

      <!-- Section avis (si commande terminée) -->
      ${reviewHtml}

      <!-- Section prêt de matériel (si applicable) -->
      ${materialHtml}

      <!-- Bouton annuler (si commande en attente) -->
      ${cancelHtml}
    `;

    commandesList.appendChild(card);
  });

  // Branche les listeners sur les boutons annuler
  setupCancelButtons();
}

/* ===============================
   FONCTION : GÉNÉRER LA TIMELINE DE SUIVI
    - 1.  Affiche les étapes de la commande sous forme de badges horizontaux
    - 2.  Chaque badge contient : statut + date
    Exemple : "En attente — 2024-12-10 10:00"
   =============================== */

function renderTimeline(timeline) {
  // Si pas de timeline, on n'affiche rien
  if (!timeline || timeline.length === 0) return '';

  // Génère un badge pour chaque étape
  const badgesHtml = timeline.map(step => {
    const stepStatus = STATUS_MAP[step.status] || { label: step.status };
    return `<span class="commande_client-timeline-badge">${stepStatus.label} — ${step.date || ''}</span>`;
  }).join('');

  return `
    <div class="commande_client-order-timeline-label">
      <i class="bi bi-clock-history"></i>
      <span>Suivi (du plus ancien au plus récent)</span>
    </div>
    <div class="commande_client-order-timeline">
      ${badgesHtml}
    </div>
  `;
}

/* ===============================
   FONCTION : GÉNÉRER LA SECTION AVIS
    - 1.  Affichée uniquement si la commande est terminée
    - 2.  Indique si un avis a été déposé et son statut (Validé, En attente)
   =============================== */

function renderReview(order) {
  // Si la commande n'est pas terminée, pas de section avis
  if (order.status !== 'terminee') return '';

  // Si un avis existe
  if (order.review) {
    const reviewStatus = order.review.isValidated ? 'Validé' : 'En attente de validation';
    return `
      <div class="commande_client-order-review">
        <i class="bi bi-chat-left-dots"></i>
        <span>Avis déposé (${reviewStatus})</span>
      </div>
    `;
  }

  // ne rien afficher
  return '';
}

/* ===============================
   FONCTION : GÉNÉRER LA SECTION PRÊT DE MATÉRIEL
    - 1.  Affichée uniquement si order.material est true
    - 2.  Indique le statut de restitution du matériel
    - 3.  Affiche un message d'info pour contacter le restaurant
   =============================== */

function renderMaterial(order) {
  // Si la commande n'inclut pas de matériel, on n'affiche rien
  if (!order.material) return '';

  // Détermine le statut de restitution
  const isReturned = order.materialReturned || false;
  const statusClass = isReturned
    ? 'commande_client-material-status-returned'
    : 'commande_client-material-status-pending';
  const statusIcon = isReturned ? '✓' : '✗';
  const statusText = isReturned ? 'Restitué' : 'En attente de restitution';

  return `
    <div class="commande_client-material-card">
      <div class="commande_client-material-title">
        <i class="bi bi-box-seam"></i>
        <span>Prêt de matériel</span>
      </div>
      <p class="commande_client-material-status">
        Statut restitution : <span class="${statusClass}">${statusIcon} ${statusText}</span>
      </p>
      <p class="commande_client-material-info">
        Pour restituer le matériel, contactez-nous par email avec le sujet "Restitution matériel".
      </p>
    </div>
  `;
}

/* ===============================
   FONCTION : GÉNÉRER LE BOUTON ANNULER
    - Affiché uniquement si la commande est en attente
    - Au clic on appelle l'API pour annuler la commande
   =============================== */

function renderCancelButton(order) {
  // Le bouton annuler n'apparait que si la commande est en attente
  if (order.status !== 'en_attente') return '';

  return `
    <button type="button" class="btn btn-commande_client-cancel" data-order-id="${order.id}">
      <i class="bi bi-x-circle"></i> Annuler
    </button>
  `;
}

/* ===============================
   FONCTION : BRANCHER LES LISTENERS SUR LES BOUTONS ANNULER
    - 1.  Sélectionne tous les boutons annuler générés dynamiquement
    - 2.  Au clic en attend la confirmation puis appel API PATCH /api/orders/{id}/cancel
   =============================== */

function setupCancelButtons() {
  // Sélectionne tous les boutons annuler dans le conteneur
  const cancelButtons = commandesList.querySelectorAll('.btn-commande_client-cancel');

  cancelButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      // Récupère l'ID de la commande depuis l'attribut data-order-id
      const orderId = btn.dataset.orderId;
      if (!orderId) return;

      // Demande confirmation à l'utilisateur
      const confirmed = confirm(
        'Êtes-vous sûr de vouloir annuler cette commande ?\n' +
        'Cette action est irréversible.'
      );
      if (!confirmed) return;

      try {
        // Appel API pour annuler la commande
        // PATCH /api/orders/{id}/cancel
        const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log(' Commande annulée:', orderId);
          // Recharge la liste des commandes pour afficher le nouveau statut
          loadOrders();
        } else {
          const error = await response.json();
          console.error('Erreur annulation:', error.message || error);
          alert('Impossible d\'annuler cette commande.');
        }

      } catch (err) {
        console.error('Erreur réseau annulation:', err);
        alert('Erreur réseau, veuillez réessayer.');
      }
    });
  });
}

/* ===============================
   INITIALISATION
    - Charge les commandes du client depuis l'API
   =============================== */

loadOrders();
}