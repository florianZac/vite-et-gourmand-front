export function initInscriptionPage() {

  /* ===============================
   SCRIPT PAGE INSCRIPTION
   =============================== */

  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */
  
  const passwordInput = document.getElementById('PasswordInput');
  const toggleButton = document.getElementById('togglePassword');
  const phoneInput = document.getElementById('PhoneInput');
  const emailInput = document.getElementById('EmailInput');
  const postalInput = document.getElementById('PostalInput');
  const firstNameInput = document.getElementById('FirstNameInput');
  const lastNameInput = document.getElementById('LastNameInput');
  const addressInput = document.getElementById('AddressInput');
  const villeInput = document.getElementById('VilleInput');
  const inscriptionForm = document.querySelector('.inscription-form');
  const submitButton = document.querySelector('.btn-inscription-submit');

  /* ===============================
     FONCTIONS DE VALIDATION - TÉLÉPHONE
     =============================== */
  
  /**
   * Vérifie si le téléphone est valide
   * Doit commencer par 06, 07, +336 ou +337
   * Doit avoir exactement 10 chiffres
   */
  function validatePhone(phone) {
    // Enlève les espaces
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Vérifie le format: commence par 06, 07, +336 ou +337
    const startsCorrectly = /^(06|07|\+336|\+337)/.test(cleanPhone);
    
    // Vérifie qu'il y a exactement 10 chiffres au total
    const hasCorrectLength = cleanPhone.replace(/\D/g, '').length === 10;
    
    return startsCorrectly && hasCorrectLength;
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
    // Regex: min 3 char avant @, @ obligatoire, min 3 après, .fr ou .com obligatoire
    const emailRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9._-]{3,}\.(fr|com)$/;
    return emailRegex.test(email);
  } */

  /* ===============================
     FONCTIONS DE VALIDATION - CODE POSTAL
     =============================== */
  
  /**
   * Vérifie si le code postal est valide
   * Doit avoir exactement 5 chiffres
   */
  function validatePostalCode(postalCode) {
    // Vérifie qu'il contient exactement 5 chiffres
    const postalRegex = /^\d{5}$/;
    return postalRegex.test(postalCode);
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
    // Min 10 caractères
    const hasCorrectLength = password.length >= 10;
    
    // Au moins 1 majuscule
    const hasUpperCase = /[A-Z]/.test(password);
    
    // Au moins 1 minuscule
    const hasLowerCase = /[a-z]/.test(password);
    
    // Au moins 1 chiffre
    const hasDigit = /\d/.test(password);
    
    // Au moins 1 caractère spécial
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password);
    
    return {
      isValid: hasCorrectLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar,
      hasCorrectLength,
      hasUpperCase,
      hasLowerCase,
      hasDigit,
      hasSpecialChar
    };
  }

  /* ===============================
     FONCTION POUR RETOURNER L'ICÔNE BOOTSTRAP
     =============================== */
  
  function getValidationIcon(isValid) {
    if (isValid) {
      return '<i class="bi bi-check-circle-fill"></i>';
    } else {
      return '<i class="bi bi-circle"></i>';
    }
  }

  /* ===============================
     FONCTION POUR CHANGER LA COULEUR DU MESSAGE
     =============================== */
  
  function updateMessageColor(messageElement, isValid) {
    if (isValid) {
      messageElement.style.color = '#22c55e'; // Vert
    } else {
      messageElement.style.color = '#9ca3af'; // Gris
    }
  }

  /* ===============================
     FONCTION D'AFFICHAGE DES VALIDATIONS
     =============================== */
  
  /**
   * Affiche/masque et colore un message de validation
   */
  function updateValidationMessage(inputElement, isValid, messageText) {
    let messageElement = inputElement.parentElement.querySelector('.validation-message');
    
    // Crée le message s'il n'existe pas
    if (!messageElement) {
      messageElement = document.createElement('small');
      messageElement.className = 'validation-message';
      messageElement.style.display = 'block';
      messageElement.style.fontSize = '0.85rem';
      messageElement.style.marginTop = '0.25rem';
      inputElement.parentElement.appendChild(messageElement);
    }
    
    // Crée le HTML avec l'icône
    messageElement.innerHTML = getValidationIcon(isValid) + ' ' + messageText;
    
    // Change la couleur
    updateMessageColor(messageElement, isValid);
  }

  /* ===============================
     FONCTION POUR VÉRIFIER L'ÉTAT GLOBAL DU FORMULAIRE
     =============================== */
  
  function checkFormValidity() {
    // Récupère les valeurs
    const phone = phoneInput.value;
    const email = emailInput.value;
    const postalCode = postalInput.value;
    const password = passwordInput.value;
    const firstName = firstNameInput.value;
    const lastName = lastNameInput.value;
    const address = addressInput.value;
    const city = villeInput.value;

    // Vérifie que tous les champs requis sont remplis
    const allFieldsFilled = firstName && lastName && phone && email && address && city && postalCode && password;

    // Vérifie que toutes les validations regex sont OK
    const phoneValid = validatePhone(phone);
    const emailValid = validateEmail(email);
    const postalValid = validatePostalCode(postalCode);
    const passwordValid = validatePassword(password).isValid;

    // Le formulaire est valide si tous les champs sont remplis ET tous les regex sont OK
    const isFormValid = allFieldsFilled && phoneValid && emailValid && postalValid && passwordValid;

    // Change l'état du bouton submit
    if (isFormValid) {
      submitButton.disabled = false;
      submitButton.style.backgroundColor = '#C1613A'; // Couleur terracotta
      submitButton.style.opacity = '1';
      submitButton.style.cursor = 'pointer';
    } else {
      submitButton.disabled = true;
      submitButton.style.backgroundColor = '#333333'; // Gris foncé
      submitButton.style.opacity = '0.5';
      submitButton.style.cursor = 'not-allowed';
    }
  }

  /* ===============================
     LISTENERS SUR LES INPUTS - PRÉNOM & NOM
     (AJOUTÉ - manquait pour déclencher checkFormValidity)
     =============================== */
  
  if (firstNameInput) {
    firstNameInput.addEventListener('input', () => {
      checkFormValidity();
    });
  }

  if (lastNameInput) {
    lastNameInput.addEventListener('input', () => {
      checkFormValidity();
    });
  }

  /* ===============================
     LISTENERS SUR LES INPUTS - TÉLÉPHONE
     =============================== */
  
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const phone = e.target.value;
      const isValid = validatePhone(phone);
      
      updateValidationMessage(
        phoneInput,
        isValid,
        isValid ? 'Téléphone valide (06/07 ou +336/+337 + 10 chiffres)' : 'Format : 06/07 ou +336/+337 suivi de 10 chiffres'
      );
      
      checkFormValidity();
    });
  }

  /* ===============================
     LISTENERS SUR LES INPUTS - EMAIL
     =============================== */
  
  if (emailInput) {
    emailInput.addEventListener('input', (e) => {
      const email = e.target.value;
      const isValid = validateEmail(email);
      
      updateValidationMessage(
        emailInput,
        isValid,
        isValid ? 'Email valide (.fr ou .com)' : 'Min 3 caractères @ min 3 caractères .fr/.com'
      );
      
      checkFormValidity();
    });
  }

  /* ===============================
     LISTENERS SUR LES INPUTS - CODE POSTAL
     =============================== */
  
  if (postalInput) {
    postalInput.addEventListener('input', (e) => {
      const postal = e.target.value;
      const isValid = validatePostalCode(postal);
      
      updateValidationMessage(
        postalInput,
        isValid,
        isValid ? 'Code postal valide (5 chiffres)' : 'Doit contenir exactement 5 chiffres'
      );
      
      checkFormValidity();
    });
  }

  /* ===============================
     LISTENERS SUR LES INPUTS - ADRESSE & VILLE
     (AJOUTÉ - manquait pour déclencher checkFormValidity)
     =============================== */
  
  if (addressInput) {
    addressInput.addEventListener('input', () => {
      checkFormValidity();
    });
  }

  if (villeInput) {
    villeInput.addEventListener('input', () => {
      checkFormValidity();
    });
  }

  /* ===============================
     LISTENERS SUR LES INPUTS - MOT DE PASSE
     =============================== */
  
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const validation = validatePassword(password);
      
      // Crée le message avec les icônes
      let messageHTML = '';
      messageHTML += getValidationIcon(validation.hasCorrectLength) + ' Min 10 caractères<br>';
      messageHTML += getValidationIcon(validation.hasUpperCase) + ' Une lettre majuscule<br>';
      messageHTML += getValidationIcon(validation.hasLowerCase) + ' Une lettre minuscule<br>';
      messageHTML += getValidationIcon(validation.hasDigit) + ' Un chiffre<br>';
      messageHTML += getValidationIcon(validation.hasSpecialChar) + ' Un caractère spécial (!@#$...)';
      
      // On cible le parent .mb-4 (au-dessus du password-wrapper)
      // pour que le message apparaisse SOUS le wrapper, pas dedans
      const wrapperParent = passwordInput.closest('.mb-4');
      let messageElement = wrapperParent.querySelector('.validation-message');
      
      if (!messageElement) {
        messageElement = document.createElement('small');
        messageElement.className = 'validation-message';
        messageElement.style.display = 'block';
        messageElement.style.lineHeight = '1.8';
        messageElement.style.fontSize = '0.85rem';
        messageElement.style.marginTop = '0.25rem';
        // Ajoute après le password-wrapper, pas dedans
        wrapperParent.appendChild(messageElement);
      }
      
      messageElement.innerHTML = messageHTML;
      updateMessageColor(messageElement, validation.isValid);
      
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
  
  if (inscriptionForm) {
    inscriptionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Les validations ont déjà été faites, on peut envoyer
      const formData = {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        phone: phoneInput.value,
        email: emailInput.value,
        address: addressInput.value,
        city: villeInput.value,
        postalCode: postalInput.value,
        password: passwordInput.value
      };
      
      console.log('✓ Inscription valide:', formData);
      
      // Appel de l'API :
      // fetch('/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
    });
  }

  /* ===============================
     INITIALISATION - DÉSACTIVER LE BOUTON AU DÉMARRAGE
     =============================== */
  
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.style.backgroundColor = '#333333'; // Gris foncé dès le départ
    submitButton.style.opacity = '0.5';
    submitButton.style.cursor = 'not-allowed';
  }
}