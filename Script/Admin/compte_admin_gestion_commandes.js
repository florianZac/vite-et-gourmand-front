import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCompteAdminGestionCommandesPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION COMMANDE
     =============================== */
  
  // Variable debug console 
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération de toutes les commandes
  const apiGetCommandes = `${API_URL}/api/commandes/admin`;

  // EndPoint de l'API pour la récupération des status d'une commande
  const apiChangerStatut = `${API_URL}/api/employe/commandes`;

  // EndPoint de l'API pour l'annulation d'une commande
  const apiAnnuler = `${API_URL}/api/commandes/admin`;

  // EndPoint de l'API pour la mise à jour des données de restitution retour matériel
  const apiRestitution = `${API_URL}/api/employe/commandes`;
  
  // EndPoint de l'API pour la gestion du suivis des commandes
  const apiSuivi = `${API_URL}/api/employe/commandes`;


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

  // Headers réutilisables pour toutes les requêtes authentifiées
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };


  if (DebugConsole) {
    console.log("=== DEBUG INIT COMPTE ADMIN ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel :", token);
    console.log("Rôle actuel :", getRole());
    console.log("================================");
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
  loadUserName();






}