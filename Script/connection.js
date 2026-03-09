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
  const connectionForm = document.querySelector('.login-form');
  const submitButton = document.querySelector('.btn-login');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
  /* ===============================
     CRÉATION DU MESSAGE D'ERREUR
     =============================== */

  // Crée l'élément d'erreur sous le bouton de connexion
  let errorMessage = document.querySelector('.login-error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('p');
    errorMessage.className = 'login-error-message';
    // Insère après le bouton submit
    submitButton.insertAdjacentElement('afterend', errorMessage);
  }

  /* ===============================
     FONCTION POUR AFFICHER/MASQUER L'ERREUR
     =============================== */

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
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
     FONCTION POUR VÉRIFIER L'ÉTAT GLOBAL DU FORMULAIRE
     =============================== */
  
  function checkFormValidity() {
    // Récupère les valeurs
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

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

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value.trim(); // valeur actuelle
      checkFormValidity();
      updateFieldState(passwordInput, validatePassword(password));
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const email = emailInput.value.trim();
      checkFormValidity();
      updateFieldState(emailInput, validateEmail(emailInput.value.trim()));
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
  
  if (connectionForm) {
    connectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        email: emailInput.value.trim(),
        password: passwordInput.value
      };
      
      console.log(' Connexion envoyée:', formData);
      
      // Appel de l'API :
      // try {
      //   const response = await fetch('/api/login', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData)
      //   });
      //   const data = await response.json();
      //
      //   if (response.ok) {
      //     // Stocke le token JWT
      //     localStorage.setItem('token', data.token);
      //     // Redirige vers l'accueil
      //     navigate('/');
      //   } else {
      //     // Affiche l'erreur retournée par l'API
      //     showError(data.message || 'Email ou mot de passe incorrect.');
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