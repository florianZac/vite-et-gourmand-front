import { API_URL } from './config.js';
export function initContactPage() {

  /* ===============================
   SCRIPT PAGE CONTACT
   =============================== */

  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  const subjectInput = document.getElementById('SubjectInput');
  const emailInput = document.getElementById('EmailInput');
  const messageInput = document.getElementById('MessageInput');
  const contactForm = document.querySelector('.contact-form');
  const submitButton = document.querySelector('.btn-contact');
  const charCount = document.querySelector('.contact-char-count');

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de base de l'API Symfony
  const apiContact = `${API_URL}/api/contact`;

  /* ===============================
     CRÉATION DES MESSAGES (ERREUR & SUCCÈS)
     =============================== */

  let errorMessage = document.querySelector('.contact-error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('p');
    errorMessage.className = 'contact-error-message';
    submitButton.closest('.d-grid').insertAdjacentElement('afterend', errorMessage);
  }

  let successMessage = document.querySelector('.contact-success-message');
  if (!successMessage) {
    successMessage = document.createElement('p');
    successMessage.className = 'contact-success-message';
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

  function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9._-]{3,}\.(fr|com)$/;
    return emailRegex.test(email);
  }

  /* ===============================
     COMPTEUR DE CARACTÈRES - TEXTAREA
     =============================== */

  if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
      charCount.textContent = `${messageInput.value.length}/500`;
      checkFormValidity();
    });
  }

  /* ===============================
    FACTORISATION DE LA VALIDATION
    =============================== */
  function updateFieldState(input, isValid) {
    if (input.value.trim() === '') {
      input.classList.remove('is-valid', 'is-invalid');
    } else if (isValid) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
    }
  }

  /* ===============================
     LISTENERS SUR LES INPUTS
     =============================== */
  if (subjectInput) {
    subjectInput.addEventListener('input', () => {
      checkFormValidity();
      updateFieldState(subjectInput, subjectInput.value.trim().length >= 3 && subjectInput.value.trim().length <= 100);
    });
  }
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      checkFormValidity();
      updateFieldState(emailInput, validateEmail(emailInput.value.trim()));
    });
  }
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      checkFormValidity();
        updateFieldState(messageInput, messageInput.value.trim().length > 10 && messageInput.value.trim().length <= 500);
    });
  }

  /* ===============================
     FONCTION POUR VÉRIFIER L'ÉTAT DU FORMULAIRE
     =============================== */

  function checkFormValidity() {
    const subject = subjectInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Sujet entre 3 et 100 caractères, email valide, message non vide
    const isFormValid = subject.length >= 3 && subject.length <= 100 
                        && validateEmail(email) 
                        && message.length > 0 && message.length <= 500;

    submitButton.disabled = !isFormValid;

    hideMessages();
  }

  /* ===============================
     GESTION DE LA SOUMISSION DU FORMULAIRE
     =============================== */

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        subject: subjectInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim()
      };

      console.log('✓ Contact envoyé:', formData);

      // Appel de l'API :
      // try {
      //   const response = await fetch(apiContact, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData)
      //   });
      //   const data = await response.json();
      //
      //   if (response.ok) {
      //     showSuccess('Votre message a bien été envoyé. Nous vous répondrons sous 24h.');
      //     subjectInput.value = '';
      //     emailInput.value = '';
      //     messageInput.value = '';
      //     charCount.textContent = '0/500';
      //     submitButton.disabled = true;
      //   } else {
      //     showError(data.message || 'Une erreur est survenue. Veuillez réessayer.');
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