import { API_URL} from '../../config.js';
import { setToken, setCookie, showAndHideElementsForRole,sanitizeInput, getSanitizedFormData, sanitizeHtml } from '../../script.js';

export function initConnexionPage() {

  /* ===============================
      SCRIPT PAGE CONNEXION
     =============================== */

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */
  
  const passwordInput = document.getElementById('PasswordInput');
  const toggleButton = document.getElementById('togglePassword');
  const emailInput = document.getElementById('EmailInput');
  const btnLogin = document.getElementById('btnLogin');
  const submitButton = document.querySelector('.btn-login');

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour le traitement du login 
  const apiConnectionUser = `${API_URL}/api/login`;

  // Variable debug console si à true
  let DebugConsole = false;

  // Variable pour éviter le double click lors de la connection
  let isSubmitting = false; 

  /* ===============================
      CRÉATION DU MESSAGE D'ERREUR
     =============================== */

  // Crée l'élément d'erreur sous le bouton de connexion
  let serverErrorMessage = document.querySelector('.login-error-message');
  if (!serverErrorMessage) {
    serverErrorMessage = document.createElement('p');
    serverErrorMessage.className = 'login-error-message';
    // Insère après le bouton submit
    submitButton.insertAdjacentElement('afterend', serverErrorMessage);
  }

  /* ===============================
      FONCTION POUR AFFICHER/MASQUER L'ERREUR
     =============================== */
  function showError(message) {
    serverErrorMessage.textContent = sanitizeHtml(message);
    serverErrorMessage.style.display = 'block';
  }

  function hideError() {
    serverErrorMessage.style.display = 'none';
    serverErrorMessage.textContent = '';
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
      FONCTIONS DE VALIDATION - MOT DE PASSE
     =============================== */

  /**
   * Vérifie si le mot de passe est valide
   * Min 10 caractères
   * Au moins 1 lettre majuscule
   * Au moins 1 lettre minuscule
   * Au moins 1 chiffre
   * Au moins 1 caractère spécial (!@#$...)
   */
  function validatePassword(password) {
    const hasCorrectLength = password.length >= 10;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password);
    
    return hasCorrectLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
  }

  /* ===============================
      FACTORISATION DE LA VALIDATION
     =============================== */
  function updateFieldState(input, isValid, successMessage, errorMessage) {
    // Remonte au .mb-4 parent (au lieu de .password-wrapper)
    const parentDiv = input.closest('.mb-4');
    const validDiv = parentDiv.querySelector('.valid-feedback');
    const invalidDiv = parentDiv.querySelector('.invalid-feedback');

    if (input.value.trim() === '') {
      input.classList.remove('is-valid', 'is-invalid');
      if (validDiv) validDiv.style.display = 'none';
      if (invalidDiv) invalidDiv.style.display = 'none';
    } else if (isValid) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
      if (validDiv) {
        validDiv.textContent = successMessage;
        validDiv.style.display = 'block';
      }
      if (invalidDiv) invalidDiv.style.display = 'none';
    } else {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      if (invalidDiv) {
        invalidDiv.textContent = errorMessage;
        invalidDiv.style.display = 'block';
      }
      if (validDiv) validDiv.style.display = 'none';
    }
  }

  /* ===============================
      FONCTION POUR VÉRIFIER L'ÉTAT GLOBAL DU FORMULAIRE
     =============================== */
  function checkFormValidity() {
    const email = sanitizeInput(emailInput.value.trim());
    const password = sanitizeInput(passwordInput.value.trim());

    // Vérifie que les champs sont remplis ET les validations OK
    const isFormValid = email !== '' && password !== '' && validateEmail(email) && validatePassword(password);

    // Active ou désactive le bouton (le style est géré par le CSS :disabled)
    submitButton.disabled = !isFormValid;

    // Cache le message d'erreur quand l'utilisateur modifie un champ
    hideError();
  }

  /* ===============================
      LISTENERS SUR LES INPUTS
     =============================== */
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const val = sanitizeInput(emailInput.value.trim());
      updateFieldState(emailInput, validateEmail(val), "Le mail est correct.", "Le mail n'est pas valide.");
      checkFormValidity();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const val = sanitizeInput(passwordInput.value.trim());
      updateFieldState(passwordInput, validatePassword(val), "Le mot de passe est correct.", "Le mot de passe n'est pas valide.");
      checkFormValidity();
    });
  }

  /* ===============================
      TOGGLE AFFICHER/MASQUER MOT DE PASSE
     =============================== */
  
  if (passwordInput && toggleButton) {
    toggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.innerHTML = '<i class="bi bi-eye-slash"></i>';
      } else {
        passwordInput.type = 'password';
        toggleButton.innerHTML = '<i class="bi bi-eye"></i>';
      }
    });
  }

  /* ===============================
      GESTION DE LA SOUMISSION DU FORMULAIRE
     =============================== */
  // Le bouton est type="button", on écoute le click

  if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
      e.preventDefault();

      // si déjà envoi du login, on bloque tout
      if (isSubmitting) return; 
      isSubmitting = true;

      // Désactive le bouton pendant l'envoi
      btnLogin.disabled = true;
      btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Connexion en cours...';
      hideError();

      // Mapping des champs HTML pour l'API Symfony
      // Pour l'email on enlèves les espaces avant/après
      // Pour l'email non car cela peut faire partie du mdp
      const safeData = {
        email: sanitizeInput(emailInput.value),
        password: sanitizeInput(passwordInput.value)
      };

      if(DebugConsole){
        console.log("[btnLogin] safeData : ",safeData);
      }

      // Appel de l'API :
      try {
        const response = await fetch(apiConnectionUser, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safeData)
        });

        let data = null;
        // évite que le script crash si la réponse n'est pas du JSON
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {

          // Stocke le token JWT dans un cookie (7 jours)
          setToken(data.token);

          setCookie('accesstoken', data.token, 7);

          // Stocke le rôle depuis la réponse API
          setCookie('role', data.utilisateur.role, 7);
          
          if(DebugConsole){
            console.log("Utilisateur Connecté :", {
              token: data.token,
              email: sanitizeHtml(data.utilisateur.email),
              prenom: sanitizeHtml(data.utilisateur.prenom),
              role: sanitizeHtml(data.utilisateur.role),
            });
          }
          // Met à jour la navbar
          showAndHideElementsForRole();

          // Redirige vers l'accueil
          window.location.href = '/';

        }
        else {
          // 401 = identifiants incorrects ou autre erreur API
          showError(data.message || 'Email ou mot de passe incorrect.');
          emailInput.classList.add('is-invalid');
          passwordInput.classList.add('is-invalid');
        }

      } catch (err) {
        // Gestion des erreurs réseau
        if(DebugConsole){
          console.error("Erreur réseau :", { err });
        }
        showError('Impossible de contacter le serveur. Vérifiez que l\'API est lancée.');
      } finally {
        // Réactive le bouton dans tous les cas et reset flag
        isSubmitting = false;
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="bi bi-person-fill-check"></i> Se connecter';
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