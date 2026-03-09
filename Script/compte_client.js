export function initcompte_clientPage() {

  /* ===============================
   SCRIPT PAGE compte_client
   Gère :
    0. Le mise à jour du nom en haut de page
    1. Le chargement des données utilisateur depuis l'API (GET)
    2. La sauvegarde des modifications du compte_client (PUT)
    3. La suppression du compte (DELETE)
    4. La demande de désactivation du compte (PATCH)
    5. La navigation par onglets (Mes commandes / Mon compte_client)
   =============================== */

  /* ===============================
     CONFIGURATION API
     - 1. BASE_URL : URL de base de l'API Symfony
     - 2. On récupère le token JWT stocké dans le localStorage
      pour authentifier les requêtes
     =============================== */

  const BASE_URL = 'http://127.0.0.1:8000/api';

  // Récupère le token JWT pour l'authentification des requêtes
  const token = localStorage.getItem('token');

  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // Champs du formulaire compte_client
  const firstNameInput = document.getElementById('compte_clientFirstName');
  const lastNameInput = document.getElementById('compte_clientLastName');
  const phoneInput = document.getElementById('compte_clientPhone');
  const emailInput = document.getElementById('compte_clientmail');
  const addressInput = document.getElementById('compte_clientAddress');
  const cityInput = document.getElementById('compte_clientCity');
  const postalInput = document.getElementById('compte_clientPostal');

  // Éléments d'affichage de l'avatar zone
  const displayName = document.getElementById('compte_client-display-name');
  const displayEmail = document.getElementById('compte_client-display-email');

  // Boutons d'action
  const btnSave = document.getElementById('btn-save-compte_client');
  const btnDelete = document.getElementById('btn-delete-account');
  const btnDeactivate = document.getElementById('btn-deactivate-account');

  /* ===============================
    AFFICHAGE DU PRÉNOM DANS LE HERO
    - 1.  Décode le token JWT pour récupérer le prénom
    - 2.  Remplit le span #hero-user-name avec le prénom
    =============================== */

  if (token) {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      const firstName = decoded.firstName || decoded.prenom || decoded.username || '';

      const heroName = document.getElementById('hero-user-name');
      if (heroName) heroName.textContent = firstName;

    } catch (err) {
      console.error('Erreur décodage token:', err);
    }
  }

  /* ===============================
     FONCTION : CHARGER LES DONNÉES UTILISATEUR
     - 1. Appelle GET /api/me qui retourne le compte_client connecté
     - 2. Remplit tous les champs du formulaire avec les données reçues
     - 3. Met à jour le nom et l'email affichés sous l'avatar
     =============================== */

  async function loadUsercompte_client() {
    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
          // Le token JWT permet à l'API de savoir quel utilisateur est connecté
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Si la réponse n'est pas OK (401 non autorisé, 500 erreur serveur, etc.)
      if (!response.ok) {
        console.error('Erreur chargement profil:', response.status);
        return;
      }

      // Parse la réponse JSON contenant les données utilisateur
      const user = await response.json();

      // Remplit chaque champ du formulaire avec les données de l'API
      // L'opérateur ?. évite une erreur si l'élément DOM n'existe pas
      if (firstNameInput) firstNameInput.value = user.firstName || '';
      if (lastNameInput) lastNameInput.value = user.lastName || '';
      if (phoneInput) phoneInput.value = user.phone || '';
      if (emailInput) emailInput.value = user.email || '';
      if (addressInput) addressInput.value = user.address || '';
      if (cityInput) cityInput.value = user.city || '';
      if (postalInput) postalInput.value = user.postalCode || '';

      // Met à jour le nom et l'email affichés sous l'avatar
      updateDisplayIdentity();

      console.log(' Profil chargé avec succès');

    } catch (err) {
      // Erreur réseau
      console.error('Erreur réseau chargement profil:', err);
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

    // Met à jour le nom affiché sous l'avatar
    // Si les deux champs sont vides, affiche un tiret
    if (displayName) {
      displayName.textContent = (firstName || lastName)
        ? `${firstName} ${lastName}`.trim()
        : '—';
    }

    // Met à jour l'email affiché sous le nom
    if (displayEmail) {
      displayEmail.textContent = email || '—';
    }
  }

  /* ===============================
     FONCTION : SAUVEGARDER LES MODIFICATIONS DU compte_client
     - 1. Collecte toutes les valeurs du formulaire
     - 2. Envoie une requête PUT /api/me avec les nouvelles données
     - 3. Met à jour l'affichage sous l'avatar après la sauvegarde
     =============================== */

  async function savecompte_client() {

    // Collecte les données du formulaire dans un objet
    const compte_clientData = {
      firstName: firstNameInput?.value || '',
      lastName: lastNameInput?.value || '',
      phone: phoneInput?.value || '',
      email: emailInput?.value || '',
      address: addressInput?.value || '',
      city: cityInput?.value || '',
      postalCode: postalInput?.value || ''
    };

    console.log(' Données profil à sauvegarder:', compte_clientData);

    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Envoie les données au format JSON dans le body de la requête
        body: JSON.stringify(compte_clientData)
      });

      // Parse la réponse de l'API
      const data = await response.json();

      if (response.ok) {
        // Succès : met à jour l'affichage sous l'avatar
        updateDisplayIdentity();
        console.log(' Profil sauvegardé avec succès');

        // Affiche un message de confirmation à l'utilisateur
        showNotification('Vos modifications ont été sauvegardées.', 'success');
      } else {
        // L'API a retourné une erreur (validation, etc.)
        console.error('Erreur sauvegarde profil:', data.message || data);
        showNotification('Erreur lors de la sauvegarde.', 'error');
      }

    } catch (err) {
      console.error('Erreur réseau sauvegarde profil:', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }

  /* ===============================
     FONCTION : SUPPRIMER LE COMPTE
     - 1. Demande une confirmation à l'utilisateur (double sécurité)
     - 2. Envoie une requête DELETE /api/me
     - 3. Redirige vers la page d'accueil après suppression
     =============================== */

  async function deleteAccount() {
    // Première confirmation : popup navigateur
    const confirmed = confirm(
      'Êtes-vous sûr de vouloir supprimer votre compte ?\n\n' +
      'Cette action est irréversible. Toutes vos données seront supprimées.'
    );

    // Si l'utilisateur annule, on ne fait rien
    if (!confirmed) return;

    console.log('🗑️ Demande de suppression du compte...');

    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(' Compte supprimé avec succès');

        // Supprime le token JWT lors de la déconnexion
        localStorage.removeItem('token');

        // Redirige vers la page d'accueil
        window.location.href = '/';
      } else {
        const data = await response.json();
        console.error('Erreur suppression compte:', data.message || data);
        showNotification('Erreur lors de la suppression du compte.', 'error');
      }

    } catch (err) {
      console.error('Erreur réseau suppression compte:', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }

  /* ===============================
     FONCTION : DEMANDER LA DÉSACTIVATION DU COMPTE
     - 1. Envoie une requête PATCH /api/me/deactivate
     - 2. Ne supprime pas le compte, mais envoie une demande
       qui sera traitée par un administrateur
     - 3. L'utilisateur reste connecté après la demande
     =============================== */

  async function requestDeactivation() {
    // Confirmation avant d'envoyer la demande
    const confirmed = confirm(
      'Êtes-vous sûr de vouloir demander la désactivation de votre compte ?\n\n' +
      'Cette demande sera traitée par un administrateur.'
    );

    if (!confirmed) return;

    console.log('⏸️ Demande de désactivation du compte...');

    try {
      const response = await fetch(`${BASE_URL}/me/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(' Demande de désactivation envoyée');
        showNotification(
          'Votre demande de désactivation a été envoyée. Un administrateur la traitera prochainement.',
          'success'
        );
      } else {
        const data = await response.json();
        console.error('Erreur désactivation:', data.message || data);
        showNotification('Erreur lors de la demande de désactivation.', 'error');
      }

    } catch (err) {
      console.error('Erreur réseau désactivation:', err);
      showNotification('Erreur réseau, veuillez réessayer.', 'error');
    }
  }

  /* ===============================
     FONCTION : AFFICHER UNE NOTIFICATION
     - 1. Crée dynamiquement un élément de notification
     - 2. L'ajoute en haut de la section compte_client
     - 3. La notification disparaît automatiquement après 4 secondes
     - 4. type : 'success' (vert) ou 'error' (rouge)
     =============================== */

  function showNotification(message, type = 'success') {

    // Supprime une éventuelle notification déjà affichée
    const existing = document.querySelector('.compte_client-notification');
    if (existing) existing.remove();

    // Crée l'élément de notification
    const notification = document.createElement('div');
    notification.className = `compte_client-notification compte_client-notification-${type}`;

    // Icône Bootstrap selon le type check pour succès, exclamation pour erreur
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
    notification.innerHTML = `<i class="bi ${icon}"></i> ${message}`;

    // Insère la notification au début de la section profil
    const section = document.querySelector('.compte_client-section .col-12');
    if (section) {
      // Insère après les onglets mais avant le contenu
      const identity = document.querySelector('.compte_client-identity');
      if (identity) {
        section.insertBefore(notification, identity);
      } else {
        section.prepend(notification);
      }
    }

    // La notification disparaît après 4 secondes avec un fondu
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      // Supprime l'élément du DOM après la transition
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  /* ===============================
     LISTENERS : BOUTONS D'ACTION
     =============================== */

  // Bouton "Sauvegarder les modifications"
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      savecompte_client();
    });
  }

  // Bouton "Supprimer mon compte"
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      deleteAccount();
    });
  }

  // Bouton "Demander la désactivation de mon compte"
  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', () => {
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
      Au chargement de la page, on récupère les données
       du compte_client depuis l'API pour pré-remplir le formulaire
     =============================== */
     
  loadUsercompte_client();
}