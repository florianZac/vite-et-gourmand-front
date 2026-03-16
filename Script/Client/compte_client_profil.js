import { API_URL } from '../config.js';
import { getToken, getRole, signout } from '../script.js';

export function initcompte_client_profilPage() {

  /* ===============================
   SCRIPT PAGE COMPTE CLIENT PROFIL
   Gère :
    0. L'affichage du prénom dans le hero via /api/me
    1. Le chargement des données utilisateur via GET /api/client/profil
    2. La sauvegarde des modifications via PUT /api/client/profil
    3. La demande de désactivation du compte via POST /api/client/compte/desactivation
    4. La navigation par onglets (Mes commandes / Mon profil)
   =============================== */

  // Variable debug console
  let DebugConsole = true;

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de récupération des infos utilisateur (prénom hero)
  const apiMeUrl = `${API_URL}/api/me`;

  // URL du profil client (GET pour charger, PUT pour sauvegarder)
  const apiProfilUrl = `${API_URL}/api/client/profil`;

  // URL de demande de désactivation du compte
  const apiDesactivationUrl = `${API_URL}/api/client/compte/desactivation`;
 
  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API PROFIL ===");
    console.log("API_URL :", API_URL);
    console.log("apiMeUrl :", apiMeUrl);
    console.log("apiProfilUrl :", apiProfilUrl);
    console.log("apiDesactivationUrl :", apiDesactivationUrl);
    console.log("===============================");
  }

  /* ===============================
      RECUPERATION DES INFOS UTILISATEURS
     =============================== */

  // Récupère le token JWT depuis le cookie (géré par script.js)
  const token = getToken();

  if (!token) {
    console.error('Pas de token, impossible de charger le profil');
    return;
  }

  if (DebugConsole) {
    console.log("=== DEBUG INIT PROFIL ===");
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
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // Champs du formulaire profil
  const firstNameInput = document.getElementById('compte_client_profilFirstName');
  const lastNameInput = document.getElementById('compte_client_profilLastName');
  const phoneInput = document.getElementById('compte_client_profilPhone');
  const emailInput = document.getElementById('compte_client_profilEmail');
  const addressInput = document.getElementById('compte_client_profilAddress');
  const cityInput = document.getElementById('compte_client_profilCity');
  const postalInput = document.getElementById('compte_client_profilPostal');

  // Éléments d'affichage de l'avatar zone
  const displayName = document.getElementById('compte_client_profil-display-name');
  const displayEmail = document.getElementById('compte_client_profil-display-email');

  // Boutons d'action
  const btnSave = document.getElementById('btn-save-compte_client_profil');
  const btnDelete = document.getElementById('btn-delete-account');
  const btnDeactivate = document.getElementById('btn-deactivate-account');

  if (DebugConsole) {
    console.log("[DOM] Champs trouvés :", {
      firstNameInput: !!firstNameInput,
      lastNameInput: !!lastNameInput,
      phoneInput: !!phoneInput,
      emailInput: !!emailInput,
      addressInput: !!addressInput,
      cityInput: !!cityInput,
      postalInput: !!postalInput,
      displayName: !!displayName,
      displayEmail: !!displayEmail,
      btnSave: !!btnSave,
      btnDelete: !!btnDelete,
      btnDeactivate: !!btnDeactivate,
    });
  }

  /* ===============================
    AFFICHAGE DU PRÉNOM DANS LE HERO
    - 1.  Appelle GET /api/me
    - 2.  Récupère le prénom depuis { utilisateur: { prenom, ... } }
    - 3.  Remplit le span #hero-user-name
    =============================== */


  async function loadHeroName() {
    if (DebugConsole) console.log("[loadHeroName] Début - Appel GET", apiMeUrl);

    try {
      const response = await fetch(apiMeUrl, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log("[loadHeroName] Réponse status :", response.status);

      if (!response.ok) return;

      const data = await response.json();
      if (DebugConsole) console.log("[loadHeroName] Données reçues :", data);

      const heroName = document.getElementById('hero-user-name');
      if (heroName && data.utilisateur) {
        heroName.textContent = data.utilisateur.prenom || data.utilisateur.email || '';
        if (DebugConsole) console.log("[loadHeroName] Prénom affiché :", data.utilisateur.prenom);
      }

    } catch (err) {
      console.error('[loadHeroName] Erreur :', err);
    }
  }

  /* ===============================
     FONCTION : CHARGER LES DONNÉES UTILISATEUR
     - 1. Appelle GET /api/me qui retourne le compte client profil connecté
     - 2. Réponse attendue : { status: "Succès", utilisateur: { id, nom, prenom, email, telephone, adresse_postale, ville, code_postal, pays, ... } }
     - 3. Remplit tous les champs du formulaire avec les données reçues
     - 4. Met à jour le nom et l'email affichés sous l'avatar
     =============================== */

  async function loadUserProfil() {
    if (DebugConsole) console.log("[loadUserProfil] Début - Appel GET", apiProfilUrl);

    try {
      const response = await fetch(apiProfilUrl, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log("[loadUserProfil] Réponse status :", response.status);

      if (!response.ok) {
        console.error('[loadUserProfil] Erreur chargement profil:', response.status);
        return;
      }

      const data = await response.json();
      if (DebugConsole) console.log("[loadUserProfil] Données reçues :", data);

      // L'API retourne { status: "Succès", utilisateur: { ... } }
      const user = data.utilisateur;
      if (!user) {
        console.error('[loadUserProfil] Pas de données utilisateur dans la réponse');
        return;
      }

      // Remplit chaque champ du formulaire avec les données de l'API
      if (firstNameInput) firstNameInput.value = user.prenom || '';
      if (lastNameInput) lastNameInput.value = user.nom || '';
      if (phoneInput) phoneInput.value = user.telephone || '';
      if (emailInput) emailInput.value = user.email || '';
      if (addressInput) addressInput.value = user.adresse_postale || '';
      if (cityInput) cityInput.value = user.ville || '';
      if (postalInput) postalInput.value = user.code_postal || '';

      if (DebugConsole) console.log("[loadUserProfil] Champs remplis avec succès");

      // Met à jour le nom et l'email affichés sous l'avatar
      updateDisplayIdentity();

    } catch (err) {
      console.error('[loadUserProfil] Erreur réseau :', err);
    }
  }

  /* ===============================
     FONCTION : METTRE À JOUR L'AFFICHAGE DE L'IDENTITÉ
     - 1. Récupère le prénom et le nom depuis les inputs du formulaire
     - 2. Met à jour le texte affiché sous l'avatar (nom complet + email)
     - 3. Appelée après le chargement initial et après chaque sauvegarde
     =============================== */

  function updateDisplayIdentity() {

    // Construit le nom complet à partir des champs du formulaire
    const firstName = firstNameInput?.value || '';
    const lastName = lastNameInput?.value || '';
    const email = emailInput?.value || '';

    if (DebugConsole) {
      console.log("Mise à jour affichage identité");
      console.log("Prénom :", firstName);
      console.log("Nom :", lastName);
      console.log("Email :", email);
    }

    // Met à jour le nom affiché sous l'avatar
    // Si les deux champs sont vides, affiche un tiret
    if (displayName) {
      if (firstName || lastName) {
        displayName.textContent = (firstName + " " + lastName).trim();
      } else {
        displayName.textContent = "—";
      }
    }

    // Met à jour l'email affiché sous le nom
    if (displayEmail) {
      displayEmail.textContent = email || '—';
    }

    if (DebugConsole) console.log("[updateDisplayIdentity] Nom:", `${firstName} ${lastName}`, "Email:", email);
  }


  /* ===============================
     FONCTION : SAUVEGARDER LES MODIFICATIONS DU compte client profil
     - 1. Collecte toutes les valeurs du formulaire
     - 2. Envoie une requête PUT /api/client/profil avec les nouvelles données
     - 3. Corps JSON : { nom, prenom, telephone, email, adresse_postale, ville, code_postal }
     - 4. Met à jour l'affichage sous l'avatar après la sauvegarde
     =============================== */

  async function saveProfil() {
    // Collecte les données du formulaire dans un objet
    // Les clés correspondent aux noms attendus par le back (ClientController::updateUserById)
    const profilData = {
      prenom: firstNameInput?.value || '',
      nom: lastNameInput?.value || '',
      telephone: phoneInput?.value || '',
      email: emailInput?.value || '',
      adresse_postale: addressInput?.value || '',
      ville: cityInput?.value || '',
      code_postal: postalInput?.value || ''
    };

    if (DebugConsole) console.log("[saveProfil] Données à sauvegarder :", profilData);
    if (DebugConsole) console.log("[saveProfil] Appel PUT", apiProfilUrl);

    try {
      const response = await fetch(apiProfilUrl, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(profilData)
      });

      const result = await response.json();

      if (DebugConsole) {
        console.log("[saveProfil] Réponse status :", response.status);
        console.log("[saveProfil] Réponse body :", result);
      }

      if (response.ok) {
        // Succès : met à jour l'affichage sous l'avatar
        updateDisplayIdentity();
        if (DebugConsole) console.log("[saveProfil] Profil sauvegardé avec succès");
        showNotification(result.message || 'Vos modifications ont été sauvegardées.', 'success');
      } else {
        // L'API a retourné une erreur (validation, doublon email/téléphone, etc.)
        console.error('[saveProfil] Erreur :', result.message);
        showNotification(result.message || 'Erreur lors de la sauvegarde.', 'error');
      }

    } catch (err) {
      console.error('[saveProfil] Erreur réseau :', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }

  /* ===============================
     FONCTION : DEMANDER LA DÉSACTIVATION DU COMPTE
     - 1. Envoie une requête POST /api/client/compte/desactivation
     - 2. Le back change le statut en "en_attente_desactivation" et envoie un mail à l'admin
     - 3. L'utilisateur reste connecté après la demande
     =============================== */

  async function requestDeactivation() {
    // Confirmation avant d'envoyer la demande
    const confirmed = confirm(
      'Êtes-vous sûr de vouloir demander la désactivation de votre compte ?\n\n' +
      'Cette demande sera traitée par un administrateur.'
    );

    if (!confirmed) {
      if (DebugConsole) console.log("[requestDeactivation] Demande annulée par l'utilisateur");
      return;
    }

    if (DebugConsole) console.log("[requestDeactivation] Appel POST", apiDesactivationUrl);

    try {
      const response = await fetch(apiDesactivationUrl, {
        method: 'POST',
        headers: authHeaders
      });

      const result = await response.json();

      if (DebugConsole) {
        console.log("[requestDeactivation] Réponse status :", response.status);
        console.log("[requestDeactivation] Réponse body :", result);
      }

      if (response.ok) {
        if (DebugConsole) console.log("[requestDeactivation] Demande envoyée avec succès");
        showNotification(result.message || 'Votre demande de désactivation a été envoyée.', 'success');
      } else {
        console.error('[requestDeactivation] Erreur :', result.message);
        showNotification(result.message || 'Erreur lors de la demande de désactivation.', 'error');
      }

    } catch (err) {
      console.error('[requestDeactivation] Erreur réseau :', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }
  
  /* ===============================
     FONCTION : SUPPRIMER LE COMPTE
     =============================== */
  async function deleteAccount() {
    const confirmed = confirm(
      'Êtes-vous sûr de vouloir supprimer votre compte ?\n\n' +
      'Cette action est irréversible. Toutes vos données (commandes, avis) seront définitivement supprimées.'
    );

    if (!confirmed) {
      if (DebugConsole) console.log("[deleteAccount] Suppression annulée par l'utilisateur");
      return;
    }

    if (DebugConsole) console.log("[deleteAccount] Appel DELETE", apiProfilUrl);

    try {
      const response = await fetch(apiProfilUrl, {
        method: 'DELETE',
        headers: authHeaders
      });

      const result = await response.json();

      if (DebugConsole) {
        console.log("[deleteAccount] Réponse status :", response.status);
        console.log("[deleteAccount] Réponse body :", result);
      }

      if (response.ok) {
        if (DebugConsole) console.log("[deleteAccount] Compte supprimé avec succès");
        alert('Votre compte a été supprimé.');
        // Déconnecte l'utilisateur et redirige vers l'accueil
        signout();
      } else {
        showNotification(result.message || 'Erreur lors de la suppression du compte.', 'error');
      }

    } catch (err) {
      console.error('[deleteAccount] Erreur réseau :', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }

  /* ===============================
     FONCTION : AFFICHER UNE NOTIFICATION
     - 1. Crée dynamiquement un élément de notification
     - 2. L'ajoute en haut de la section profil
     - 3. La notification disparaît automatiquement après 4 secondes
     - 4. type : 'success' (vert) ou 'error' (rouge)
     =============================== */

    function showNotification(message, type = 'success') {
    if (DebugConsole) console.log(`[showNotification] ${type} : ${message}`);

    // Supprime une éventuelle notification déjà affichée
    const existing = document.querySelector('.compte_client_profil-notification');
    if (existing) existing.remove();

    // Crée l'élément de notification
    const notification = document.createElement('div');
    notification.className = `compte_client_profil-notification compte_client_profil-notification-${type}`;

    // Icône Bootstrap selon le type
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
    notification.innerHTML = `<i class="bi ${icon}"></i> ${message}`;

    // Style inline pour la notification
    notification.style.cssText = `
      padding: 0.75rem 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
      color: ${type === 'success' ? '#155724' : '#721c24'};
      border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
    `;

    // Insère la notification avant les onglets (plus visible)
    const tabs = document.querySelector('.compte_client_profil-tabs');
    if (tabs) {
      tabs.parentNode.insertBefore(notification, tabs);
      if (DebugConsole) console.log("[showNotification] Insérée avant les onglets");
    } else {
      // Fallback : insère avant l'identity card
      const identity = document.querySelector('.compte_client_profil-identity');
      if (identity) {
        identity.parentNode.insertBefore(notification, identity);
        if (DebugConsole) console.log("[showNotification] Insérée avant l'identity");
      } else {
        if (DebugConsole) console.log("[showNotification] Aucun point d'insertion trouvé !");
        return;
      }
    }

    // Scrolle vers la notification pour que l'utilisateur la voie
    notification.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // La notification disparaît après 4 secondes avec un fondu
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  /* ===============================
     LISTENERS : BOUTONS D'ACTION
     =============================== */

  // Bouton "Sauvegarder les modifications"
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      if (DebugConsole) console.log("[listener] Clic sur Sauvegarder");
      saveProfil();
    });
  }

  // Bouton "Supprimer mon compte"
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (DebugConsole) console.log("[listener] Clic sur Supprimer");
      deleteAccount();
    });
  }

  // Bouton "Demander la désactivation de mon compte"
  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', () => {
      if (DebugConsole) console.log("[listener] Clic sur Désactivation");
      requestDeactivation();
    });
  }

  /* ===============================
     LISTENER : MISE À JOUR EN TEMPS RÉEL DE L'AVATAR
      Mise à jour instantané des informations de l'avatar 
     =============================== */

  // Écoute les changements sur le champ Prénom
  if (firstNameInput) {
    firstNameInput.addEventListener('input', updateDisplayIdentity);
  }

  // Écoute les changements sur le champ Nom
  if (lastNameInput) {
    lastNameInput.addEventListener('input', updateDisplayIdentity);
  }

  // Écoute les changements sur le champ Email
  if (emailInput) {
    emailInput.addEventListener('input', updateDisplayIdentity);
  }

  /* ===============================
     INITIALISATION
     - 1. Charge le prénom dans le hero
     - 2. Charge les données du profil depuis l'API pour pré-remplir le formulaire
     =============================== */

  if (DebugConsole) console.log("=== INITIALISATION PAGE PROFIL ===");
  loadHeroName();
  loadUserProfil();
}