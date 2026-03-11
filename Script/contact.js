import { API_URL } from './config.js';

export function initContactPage() {

  /* ===============================
   SCRIPT PAGE CONTACT
   =============================== */

  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  const SujetInput = document.getElementById('SujetInput');
  const EmailInput = document.getElementById('EmailInput');
  const MessageInput = document.getElementById('MessageInput');
  const contactForm = document.querySelector('.contact-form');
  const submitButton = document.querySelector('.btn-contact');
  const charCount = document.querySelector('.contact-char-count');
  const honeypot = document.getElementById('site_web');

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de base de l'API Symfony
  const apiContact = `${API_URL}/api/contact`;

  // Variable debug console si à true
  let DebugConsole = true;

  // Variable pour éviter le double click lors de la connection
  let isSubmitting = false; 

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
    //const emailRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9._-]{3,}\.(fr|com)$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /* ===============================
     COMPTEUR DE CARACTÈRES - TEXTAREA
     =============================== */

  if (MessageInput && charCount) {
    MessageInput.addEventListener('input', () => {
      charCount.textContent = `${MessageInput.value.length}/500`;
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

     
  if (SujetInput) {
    SujetInput.addEventListener('input', () => {

      checkFormValidity();

      updateFieldState(
        SujetInput,
        SujetInput.value.trim().length >= 3 &&
        SujetInput.value.trim().length <= 100
      );

    });
  }

  if (EmailInput) {
    EmailInput.addEventListener('input', () => {

      checkFormValidity();

      updateFieldState(
        EmailInput,
        validateEmail(EmailInput.value.trim())
      );

    });
  }

  if (MessageInput) {
    MessageInput.addEventListener('input', () => {

      checkFormValidity();

      updateFieldState(
        MessageInput,
        MessageInput.value.trim().length >= 10 &&
        MessageInput.value.trim().length <= 500
      );

    });
  }

  /* ===============================
     FONCTION POUR VÉRIFIER L'ÉTAT DU FORMULAIRE
     =============================== */

  function checkFormValidity() {

    const Sujet = SujetInput.value.trim();
    const Email = EmailInput.value.trim();
    const message = MessageInput.value.trim();

    // Sujet entre 3 et 100 caractères, Email valide, message non vide
    const isFormValid =
      Sujet.length >= 3 &&
      Sujet.length <= 100 &&
      validateEmail(Email) &&
      message.length >= 10 &&
      message.length <= 500;

    submitButton.disabled = !isFormValid;

    hideMessages();
  }

  /* ===============================
     GESTION DE LA SOUMISSION DU FORMULAIRE
     =============================== */

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {

      e.preventDefault();

      // si déjà envoi du formulaire, on bloque tout
      if (isSubmitting) return;
      isSubmitting = true;

      // Désactive le bouton pendant l'envoi
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Envoi en cours...';

      hideMessages();

      // Mapping des champs HTML pour l'API Symfony
      const formData = {
        email: EmailInput.value.trim(),
        sujet: SujetInput.value.trim(),
        message: MessageInput.value.trim(),
        site_web: honeypot.value.trim(),
      };

      // On intialise la données avant l'appel API
      let response = null;

      // Appel de l'API :
      try {
        const response = await fetch(apiContact, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        let data = null;
        // évite que le script crash si la réponse n'est pas du JSON
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {

          showSuccess(
            'Votre message a bien été envoyé. Nous vous répondrons sous 24h.'
          );

          SujetInput.value = '';
          EmailInput.value = '';
          MessageInput.value = '';

          if (charCount) {
            charCount.textContent = '0/500';
          }
          submitButton.disabled = true;
          
          if(DebugConsole){
            console.log("Message envoyé :", formData);
          }

          // Redirige vers l'accueil apres 2 sec
          setTimeout(()=>{
            window.location.href='/';
          },2000);

        }else{

          if(DebugConsole){
            console.error("Erreur API :", data);
          }
          showError(data.message || 'Une erreur est survenue.');

          SujetInput.classList.add('is-invalid');
          EmailInput.classList.add('is-invalid');
          MessageInput.classList.add('is-invalid');
        }

      } catch (err) {
        // Gestion des erreurs réseau
        showError(
          'Impossible de contacter le serveur. Vérifiez que l\'API est lancée.'
        );

      } finally {

        isSubmitting = false;

        if(!response?.ok){
          submitButton.disabled = false;
        }

        // Réactive le bouton dans tous les cas et reset flag
        submitButton.innerHTML = 
          '<i class="bi bi-send-fill"></i> Envoyer le message';

        checkFormValidity();
      }
    });
  }

  /* ===============================
     INITIALISATION - DÉSACTIVER LE BOUTON AU DÉMARRAGE
     =============================== */

  if (submitButton) {
    submitButton.disabled = true;
  }
}