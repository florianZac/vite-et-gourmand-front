import { API_URL } from './config.js';
export function initResetpasswordPage() {

  /* ===============================
   SCRIPT PAGE RESET PASSWORD
   =============================== */

  /* ===============================
    Configuration API
    =============================== */
   
  const apiResetpassword = `${API_URL}/api/forgot-password`;

  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  const emailInput = document.getElementById('EmailInput');
  const resetForm = document.querySelector('.reset-password-form');
  const submitButton = document.querySelector('.btn-reset-password');

  /* ===============================
     CRÉATION DES MESSAGES (ERREUR & SUCCÈS)
     =============================== */

  // Message d'erreur
  let errorMessage = document.querySelector('.reset-password-error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('p');
    errorMessage.className = 'reset-password-error-message';
    submitButton.closest('.d-grid').insertAdjacentElement('afterend', errorMessage);
  }

  // Message de succès
  let successMessage = document.querySelector('.reset-password-success-message');
  if (!successMessage) {
    successMessage = document.createElement('p');
    successMessage.className = 'reset-password-success-message';
    errorMessage.insertAdjacentElement('afterend', successMessage);
  }

  /* ===============================
     FONCTIONS POUR AFFICHER/MASQUER LES MESSAGES
     =============================== */

  function showError(message) {
    successMessage.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function showSuccess(message) {
    errorMessage.style.display = 'none';
    successMessage.textContent = message;
    successMessage.style.display = 'block';
  }

  function hideMessages() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    successMessage.style.display = 'none';
    successMessage.textContent = '';
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
    return emailRegex.test(email);
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

      console.log('✓ Reset password envoyé pour:', email);

      // Appel de l'API :
      // try {
      //   const response = await fetch('/api/reset-password', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ email })
      //   });
      //   const data = await response.json();
      //
      //   if (response.ok) {
      //     showSuccess('Un email de réinitialisation a été envoyé à ' + email);
      //     emailInput.value = '';
      //     submitButton.disabled = true;
      //   } else {
      //     showError(data.message || 'Aucun compte trouvé avec cet email.');
      //   }
      // } catch (err) {
      //   console.error('Erreur réseau:', err);
      //   showError('Erreur de connexion au serveur. Veuillez réessayer.');
      // }
    });
  }

  /* ===============================
     INITIALISATION - DÉSACTIVER LE BOUTON AU DÉMARRAGE
     =============================== */

  if (submitButton) {
    submitButton.disabled = true;
  }
}