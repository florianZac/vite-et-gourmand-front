import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCompteAdminGestionMenusPage() {

  /* ===============================
    SCRIPT PAGE ADMIN GESTION MENUS
    =============================== */
  
  // Variable debug console : passer à false pour désactiver tous les logs
  let DebugConsole = false;

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  
  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL :", API_URL);
    console.log("apiMeUrl :", apiMeUrl);
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

  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // ----- Barre de recherche et filtres -----
  const searchInput = document.getElementById('search-order'); 
  // input texte pour rechercher un menu/commande
  const filterStatus = document.getElementById('filter-status'); 
  // select pour filtrer par statut
  const resetFiltersBtn = document.getElementById('reset-filters'); 
  // bouton pour réinitialiser les filtres

  // ----- Liste des commandes/employés -----
  const commandesList = document.getElementById('commandes-list'); 
  // div qui contiendra les cards injectées dynamiquement

  // ----- Modal d'annulation -----
  const cancelModal = document.getElementById('cancelModal'); 
  // modal bootstrap pour annuler une commande
  const cancelReasonInput = document.getElementById('cancel-reason'); 
  // textarea pour saisir le motif d'annulation
  const cancelCount = document.getElementById('cancel-count'); 
  // compteur de caractères saisis dans le textarea
  const cancelError = document.getElementById('cancel-error'); 
  // message d'erreur si aucun motif n'est renseigné
  const confirmCancelBtn = document.getElementById('confirm-cancel'); 
  // bouton pour confirmer l'annulation

  loadUserName();


}