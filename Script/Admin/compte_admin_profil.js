import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCompteAdminProfilPage() {

  /* ===============================
      SCRIPT PAGE ADMIN PROFIL
     =============================== */
  
  // Variable debug console : passer à false pour désactiver tous les logs
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // URL du profil client (GET pour charger, PUT pour sauvegarder)
  const apiProfilUrl = `${API_URL}/api/client/profil`;
  
  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL :", API_URL);
    console.log("apiMeUrl :", apiMeUrl);
    console.log("apiProfilUrl :", apiProfilUrl);
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
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // Champ prénom
  const firstNameInput = document.getElementById('compte_admin_profilFirstName');
  // Champ nom
  const lastNameInput = document.getElementById('compte_admin_profilLastName');
  // Champ téléphone
  const phoneInput = document.getElementById('compte_admin_profilPhone');
  // Champ email
  const emailInput = document.getElementById('compte_admin_profilEmail');
  // Champ adresse
  const addressInput = document.getElementById('compte_admin_profilAddress');
  // Champ ville
  const cityInput = document.getElementById('compte_admin_profilCity');
  // Champ code postal
  const postalInput = document.getElementById('compte_admin_profilPostal');
  // Nom affiché
  const displayName = document.getElementById('compte_admin_profil-display-name');
  // Email affiché
  const displayEmail = document.getElementById('compte_admin_profil-display-email');
  // Bouton pour sauvegarder les modifications
  const btnSave = document.getElementById('btn-save-compte_admin_profil');

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
      FONCTION : AFFICHAGE DU PRÉNOM DANS LE HERO
        - Appelle GET /api/me
          Décode le token JWT pour récupérer le prenom, nom, email, role
          Remplit le span #hero-user-name avec le prenom récuperer du token
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
      FONCTION : CHARGER LES DONNÉES UTILISATEUR
        -  Appelle GET /api/me qui retourne le compte client profil connecté
            Réponse attendue : { status: "Succès", utilisateur: { id, nom, prenom, email, telephone, adresse_postale, ville, code_postal, pays, ... } }
            Remplit tous les champs du formulaire avec les données reçues
            Met à jour le nom et l'email affichés sous l'avatar
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
      FONCTION : MISE À JOUR DE L'AFFICHAGE DE L'IDENTITÉ
        -  Récupère le prénom et le nom depuis les inputs du formulaire
        -  Met à jour le texte affiché sous l'avatar (nom complet + email)
        -  Appelée après le chargement initial et après chaque sauvegarde
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
    if (displayName) {
      if (firstName || lastName) {
        displayName.textContent = (firstName + " " + lastName).trim();
      } else {
        displayName.textContent = " ";
      }
    }

    // Met à jour l'email affiché sous le nom
    if (displayEmail) {
      displayEmail.textContent = email || ' ';
    }

    if (DebugConsole) console.log("[updateDisplayIdentity] Nom:", `${firstName} ${lastName}`, "Email:", email);
  }

  /* ===============================
      FONCTION : SAUVEGARDER LES MODIFICATIONS DU COMPTE ADMIN
        -  Collecte toutes les valeurs du formulaire
        -  Envoie une requête PUT /api/client/profil avec les nouvelles données
              Corps JSON : { nom, prenom, telephone, email, adresse_postale, ville, code_postal }
              Met à jour l'affichage sous l'avatar après la sauvegarde
     =============================== */

  async function saveProfil() {
    if (DebugConsole) console.log("[saveProfil] Appel PUT", apiProfilUrl);
    const prenom = firstNameInput ? firstNameInput.value : '';
    const nom = lastNameInput ? lastNameInput.value : '';
    const telephone = phoneInput ? phoneInput.value : '';

    const profilData = {
      prenom: prenom,
      nom: nom,
      telephone: telephone,
      email: emailInput ? emailInput.value : '',
      adresse_postale: addressInput ? addressInput.value : '',
      ville: cityInput ? cityInput.value : '',
      code_postal: postalInput ? postalInput.value : ''
    };

    if (DebugConsole) console.log("[saveProfil] Données à sauvegarder :", profilData);

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
        console.error('[saveProfil] Erreur :', result.message);
        showNotification(result.message || 'Erreur lors de la sauvegarde.', 'error');
      }

    } catch (err) {
      console.error('[saveProfil] Erreur réseau :', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }

  /* ===============================
      FONCTION : AFFICHER UNE NOTIFICATION
        - Crée dynamiquement un élément de notification
        - Ajoute en haut de la section profil
            La notification disparaît automatiquement après 4 secondes
            type : 'success' (vert) ou 'error' (rouge)
     =============================== */
    function showNotification(message, type = 'success') {
    if (DebugConsole) console.log(`[showNotification] ${type} : ${message}`);

    // Supprime une éventuelle notification déjà affichée
    const existing = document.querySelector('.compte_admin_profil-notification');
    if (existing) existing.remove();

    // Crée l'élément de notification
    const notification = document.createElement('div');
    notification.className = `compte_admin_profil-notification compte_admin_profil-notification-${type}`;

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
      justify-content:center;
      gap: 0.5rem;
      background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
      color: ${type === 'success' ? '#155724' : '#721c24'};
      border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
    `;

    // Insère la notification avant les onglets
    const tabs = document.querySelector('.compte_admin_profil-tabs');
    if (tabs) {
      tabs.parentNode.insertBefore(notification, tabs);
      if (DebugConsole) console.log("[showNotification] Insérée avant les onglets");
    } else {
      // Fallback : insère avant l'identity card
      const identity = document.querySelector('.compte_admin_profil-identity');
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
        - Charge le prénom dans le hero
        - Charge les données du profil depuis l'API pour pré-remplir le formulaire
     =============================== */

  if (DebugConsole) console.log("=== INITIALISATION PAGE PROFIL ===");
  loadUserName();
  loadUserProfil();
}
