import { API_URL } from '../../config.js';
export function initforgotpasswordPage() {

  /* ===============================
      SCRIPT PAGE RESET PASSWORD
     =============================== */
  let DebugConsole = false;

  /* ===============================
      Configuration API
     =============================== */
  
  // EndPoint de l'API pour la gestion de l'oublie du mot de passe  
  const apiForgotpassword = `${API_URL}/api/forgot-password`;

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  const emailInput = document.getElementById('EmailInput');
  const resetForm = document.querySelector('.reset-password-form');
  const submitButton = document.querySelector('.btn-reset-password');

  if (DebugConsole) {
    console.log("=== DEBUG INIT RESET PASSWORD ===");
    console.log("Input email :", emailInput);
    console.log("Form reset :", resetForm);
    console.log("Bouton submit :", submitButton);
    console.log("===============================");
  }
  /* ===============================
      CRÉATION DES MESSAGES (ERREUR & SUCCÈS)
     =============================== */

  // Message d'erreur
  let errorMessage = document.querySelector('.reset-password-error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('p');
    errorMessage.className = 'reset-password-error-message';
    submitButton.closest('.d-grid').insertAdjacentElement('afterend', errorMessage);
    if (DebugConsole) console.log("Création message erreur :", errorMessage);
  }

  // Message de succès
  let successMessage = document.querySelector('.reset-password-success-message');
  if (!successMessage) {
    successMessage = document.createElement('p');
    successMessage.className = 'reset-password-success-message';
    errorMessage.insertAdjacentElement('afterend', successMessage);
    if (DebugConsole) console.log("Création message succès :", successMessage);
  }

  /* ===============================
      FONCTIONS POUR AFFICHER/MASQUER LES MESSAGES
     =============================== */

  function showError(message) {
    successMessage.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    if (DebugConsole) console.log("Erreur :", message);
  }

  function showSuccess(message) {
    errorMessage.style.display = 'none';
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    if (DebugConsole) console.log("Succès :", message);
    // Redirection vers login après 2 secondes
    setTimeout(() => {
      if (DebugConsole) {
        console.log("Redirection vers la page de connection...");
      }
      window.location.href = "/login";
    }, 2000);
  }

  function hideMessages() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    successMessage.style.display = 'none';
    successMessage.textContent = '';
    if (DebugConsole) console.log("Messages masqués");
  }

  /* ===============================
      FONCTIONS DE VALIDATION - EMAIL
     =============================== */

  /**
   * Vérifie si l'email est valide
   * Min 3 caractères avant @
   * Contient @
   * Min 3 caractères après @
   * Se termine par .fr ou .com
   */
  function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9._-]{3,}\.(fr|com)$/;
    const valid = emailRegex.test(email);
    if (DebugConsole) console.log(`validateEmail("${email}") => ${valid}`);
    return valid;
  }

  /* ===============================
      FONCTION POUR VÉRIFIER L'ÉTAT DU FORMULAIRE
     =============================== */

  function checkFormValidity() {
    const email = emailInput.value.trim();

    // Le bouton est actif si l'email est valide
    submitButton.disabled = !validateEmail(email);

    // Cache les messages quand l'utilisateur modifie le champ
    hideMessages();
  }

  /* ===============================
      LISTENER SUR L'INPUT EMAIL
     =============================== */

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const email = emailInput.value.trim();

      // Si le champ est vide on retire les deux classes (état neutre)
      if (email === '') {
        emailInput.classList.remove('is-valid', 'is-invalid');
      }
      // Si l'email est valide bordure verte
      else if (validateEmail(email)) {
        emailInput.classList.add('is-valid');
        emailInput.classList.remove('is-invalid');
      }
      // Si l'email est invalide bordure rouge
      else {
        emailInput.classList.add('is-invalid');
        emailInput.classList.remove('is-valid');
      }
      if (DebugConsole) console.log("Email input modifié :", email, "Classes :", emailInput.className);
      // Met à jour l'état
      checkFormValidity();
    });
  }

  /* ===============================
      GESTION DE LA SOUMISSION DU FORMULAIRE
     =============================== */

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      if (DebugConsole) console.log("Reset password envoyé pour : email =", email);

      // Désactive le bouton pendant l'envoi
      submitButton.disabled = true;
      submitButton.textContent = 'Envoi en cours...';
      try {
        // Appel à l'API Symfony
        const response = await fetch(apiForgotpassword, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        let data = null;
        // évite que le script crash si la réponse n'est pas du JSON
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {
          // Message générique (même si l'email n'existe pas)
          alert("mot de passe réinitialisé checké vos mail ");
          showSuccess('Si cet email existe dans notre système, un lien de réinitialisation a été envoyé');
          emailInput.value=''; 
          emailInput.classList.remove('is-valid','is-invalid');
          submitButton.disabled = true;
        } else {
          // Cas d'erreur (ex: email vide)
          showError(data.message || 'Erreur lors de la demande de réinitialisation');
        }

      } catch (err) {
        console.error('Erreur réseau:', err);
        showError('Erreur de connexion au serveur. Veuillez réessayer.');
      } finally {
        // Réactive le bouton si l'input contient quelque chose de valide
        submitButton.textContent = 'Envoyer le lien de réinitialisation';
        checkFormValidity();
      }
    });
  }

  /* ===============================
      INITIALISATION - DÉSACTIVER LE BOUTON AU DÉMARRAGE
     =============================== */
  if (submitButton) {
    submitButton.disabled = true;
    if (DebugConsole) console.log("Bouton submit désactivé au chargement");
  }
}