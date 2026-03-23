import { API_URL } from '../../config.js';

/* ===============================
    SCRIPT PAGE RESET PASSWORD
   =============================== */

let DebugConsole = true;

/* ===============================
    Configuration API
   =============================== */

  // EndPoint de l'API pour la Mise à jour du mot de passe 
const apiResetpassword = `${API_URL}/api/reset-password`;

export function initResetpasswordPage() {

/* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
   =============================== */

  const passwordInput = document.getElementById('NewPasswordInput');
  const confirmPasswordInput = document.getElementById('ConfirmPasswordInput');
  const toggleButton = document.getElementById('togglePassword');
  const toggleConfirm = document.getElementById("toggleConfirmPassword");

  const resetForm = document.querySelector('.reset-password-form');
  const submitButton = document.querySelector('.btn-reset-password');

  const errorMessage = document.querySelector('.reset-password-error-message');
  const successMessage = document.querySelector('.reset-password-success-message');

  const validationMessage = document.querySelector('.validation-message');

  if (DebugConsole) {
    console.log("=== DEBUG INIT RESET PASSWORD ===");
    console.log("Password input :", passwordInput);
    console.log("Confirm password :", confirmPasswordInput);
    console.log("Form reset :", resetForm);
    console.log("Submit button :", submitButton);
    console.log("API URL :", apiResetpassword);
    console.log("===============================");
  }
  
  if(submitButton) submitButton.disabled = true;

  /* ===============================
      EXTRACTION DU TOKEN DANS L'URL
     =============================== */

  // Récupère le token depuis l'URL

  //const token = decodeURIComponent(urlParams.get('token'));
  const urlParams = new URLSearchParams(window.location.search);
  const token = decodeURIComponent(urlParams.get('token'));
  if (DebugConsole) console.log("Token récupéré :", token);

  if (!token) {
    if (errorMessage) {
      errorMessage.textContent = "Token manquant ou invalide.";
      errorMessage.style.display = "block";
    }
    if (resetForm) resetForm.style.display = "none";
    return;
  }


  /* ===============================
      AFFICHE / CACHE LE MOT DE PASSE
     =============================== */
  if(submitButton) submitButton.disabled = true;

  // Toggle afficher/masquer le mot de passe
  if (toggleButton && passwordInput) {
    toggleButton.addEventListener("click", function() {
      if(passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.innerHTML = '<i class="bi bi-eye-slash"></i>';
      } else {
        passwordInput.type = "password";
        toggleButton.innerHTML = '<i class="bi bi-eye"></i>';
      }
      if (DebugConsole) console.log("Toggle passwordInput :", passwordInput.type);
    });
  }

  if (toggleConfirm && confirmPasswordInput) {
    toggleConfirm.addEventListener("click", function() {
      if(confirmPasswordInput.type === "password") {
        confirmPasswordInput.type = "text";
        toggleConfirm.innerHTML = '<i class="bi bi-eye-slash"></i>';
      } else {
        confirmPasswordInput.type = "password";
        toggleConfirm.innerHTML = '<i class="bi bi-eye"></i>';
      }
      if (DebugConsole) console.log("Toggle confirmPasswordInput :", confirmPasswordInput.type);
    });
  }

  /* ===============================
      FONCTIONS POUR AFFICHER / MASQUER LES MESSAGES
     =============================== */
  function showError(message) {

    if (successMessage) successMessage.style.display = 'none';

    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    }
    if (DebugConsole) console.log("Erreur :", message);

  }

  function showSuccess(message) {

    if (errorMessage) errorMessage.style.display = 'none';

    if (successMessage) {
      successMessage.textContent = message;
      successMessage.style.display = 'block';
    }

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

    if (errorMessage) {
      errorMessage.style.display = 'none';
      errorMessage.textContent = '';
    }
    if (successMessage) {
      successMessage.style.display = 'none';
      successMessage.textContent = '';
    }
    if (DebugConsole) console.log("Messages masqués");

  }

  /* =====================================================
      VALIDATION DU MOT DE PASSE
        Règles :
        - 10 caractères minimum
        - 1 majuscule
        - 1 minuscule
        - 1 chiffre
        - 1 caractère spécial
     ===================================================== */

  function validatePassword(password) {

    const validation = {
      hasCorrectLength: password.length >= 10,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecialChar: /[\W_]/.test(password)
    };
    
    validation.isValid =
      validation.hasCorrectLength &&
      validation.hasUpperCase &&
      validation.hasLowerCase &&
      validation.hasDigit &&
      validation.hasSpecialChar;

    if (DebugConsole) {
      console.log("Validation password :", validation);
    }
    return validation;
  }

  /* =====================================================
      VÉRIFICATION QUE LES DEUX MOTS DE PASSE SONT IDENTIQUES
     ===================================================== */

  // Vérification de la concordance entre les deux mot de passe
  function passwordsMatch() {

    const match = passwordInput.value === confirmPasswordInput.value;

    if (DebugConsole) {
      console.log("Passwords match :", match);
    }
    return match;

  }

  /* =====================================================
      GÉNÉRATION DES ICÔNES DE VALIDATION
     ===================================================== */

  function getValidationIcon(isValid) {

    if(isValid){
      return '<i class="bi bi-check-circle-fill"></i>';
    }
    else{
      return '<i class="bi bi-circle"></i>';
    }
  }

  /* =====================================================
      AFFICHAGE DES RÈGLES DE VALIDATION
     ===================================================== */

  function updateValidationMessage(validation) {

    if (!validationMessage) return;

    let html = '';

    html += getValidationIcon(validation.hasCorrectLength) + ' Min 10 caractères<br>';
    html += getValidationIcon(validation.hasUpperCase) + ' Une lettre majuscule<br>';
    html += getValidationIcon(validation.hasLowerCase) + ' Une lettre minuscule<br>';
    html += getValidationIcon(validation.hasDigit) + ' Un chiffre<br>';
    html += getValidationIcon(validation.hasSpecialChar) + ' Un caractère spécial';

    validationMessage.innerHTML = html;

  }

  /* =====================================================
      LISTENER SUR LE CHAMP MOT DE PASSE
     ===================================================== */

  if (passwordInput) {

    passwordInput.addEventListener('input', () => {

      hideMessages();
      const validation = validatePassword(passwordInput.value);
      updateValidationMessage(validation);

      if (submitButton) {
        submitButton.disabled = !validation.isValid || !passwordsMatch();
      }
    });
  }

  /* ===============================
      LISTENER SUR LE CHAMP CONFIRMATION
     =============================== */

if(confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      hideMessages();
      const validation = validatePassword(passwordInput.value);
      if(submitButton) submitButton.disabled = !validation.isValid || !passwordsMatch();
      confirmPasswordInput.classList.toggle('is-valid', passwordsMatch());
      confirmPasswordInput.classList.toggle('is-invalid', !passwordsMatch());
    });
  }


  /* ===============================
      GESTION DE LA SOUMISSION DU FORMULAIRE
     =============================== */

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {

    e.preventDefault();
    hideMessages();

    if(!passwordsMatch()) return showError("Les mots de passe ne correspondent pas");

      const password = passwordInput.value;
      submitButton.disabled = true;
      submitButton.textContent = 'Réinitialisation en cours...';

      if(DebugConsole) {
        console.log("Envoi requête reset password :", {
          token,
          password
        });
      }
    
    try {
        const response = await fetch(apiResetpassword, {

          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            password
          })
        });

        let data = null;
        // évite que le script crash si la réponse n'est pas du JSON
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {
          if (DebugConsole) {
            console.log("Envoi reset password :", {
              token: token,
              password: passwordInput.value
            });
          }
            // Affiche le message de succès
            showSuccess(data.message || "Mot de passe réinitialisé avec succès !");
            // Modifie le texte du bouton
            submitButton.textContent = "Mot de passe réinitialisé !";
            // On vide le champ email
            submitButton.disabled = true;
        }else {
            // Affiche le message d'erreur
            showError(data.message || "Erreur lors de la réinitialisation.");
            // remettre le texte original
            submitButton.textContent = "Réinitialiser le mot de passe"; 
            submitButton.disabled = false;
        }
      } catch (error) {
        console.error(error);
        showError("Erreur réseau, veuillez réessayer.");
        // remettre le texte original
        submitButton.textContent = "Réinitialiser le mot de passe";
      } finally {
        submitButton.disabled = !validatePassword(passwordInput.value).isValid || !passwordsMatch();
      }
    });
  }
}

/* =====================================================
    INITIALISATION DU SCRIPT
   ===================================================== */

initResetpasswordPage();

