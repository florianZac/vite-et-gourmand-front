import { API_URL } from '../../config.js';
export function initInscriptionPage() {

  /* ===============================
      SCRIPT PAGE INSCRIPTION
     =============================== */

  //Variable debug console si à true
  let DebugConsole = false;

  // varibale pour évité le double click inscription
  let isSubmitting = false; 

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour l'inscription d'un utilisateur 
  const apiInscriptionUser = `${API_URL}/api/register`;

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */
  const passwordInput = document.getElementById('PasswordInput');
  const toggleButton = document.getElementById('togglePassword');
  const phoneInput = document.getElementById('PhoneInput');
  const emailInput = document.getElementById('EmailInput');
  const postalInput = document.getElementById('PostalInput');
  const prenom = document.getElementById('PrenomInput');
  const nom = document.getElementById('NomInput');
  const addressInput = document.getElementById('AddressInput');
  const villeInput = document.getElementById('VilleInput');
  const inscriptionForm = document.querySelector('.inscription-form');
  const submitButton = document.querySelector('.btn-inscription-submit');

  if (DebugConsole) {
    console.log("=== DEBUG INIT INSCRIPTION PAGE ===");
    console.log("prenom :", prenom);
    console.log("nom :", nom);
    console.log("emailInput :", emailInput);
    console.log("passwordInput :", passwordInput);
    console.log("phoneInput :", phoneInput);
    console.log("postalInput :", postalInput);
    console.log("addressInput :", addressInput);
    console.log("villeInput :", villeInput);
    console.log("inscriptionForm :", inscriptionForm);
    console.log("submitButton :", submitButton);
    console.log("API URL :", apiInscriptionUser);
    console.log("==================================");
  }

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
    const valid =startsCorrectly && hasCorrectLength;

    if (DebugConsole) console.log(`validatePhone("${phone}") =>`, valid);
    return valid;

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
    
    const valid = emailRegex.test(email);
    
    if (DebugConsole) console.log(`validateEmail("${email}") =>`, valid);
    return valid;
  }

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
    const valid = postalRegex.test(postalCode);
    if (DebugConsole) console.log(`validatePostalCode("${postalCode}") =>`, valid);
    return valid;
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
    const validation = {
      // Min 10 caractères
      hasCorrectLength: password.length >= 10,
      // Au moins 1 majuscule
      hasUpperCase: /[A-Z]/.test(password),
      // Au moins 1 minuscule
      hasLowerCase: /[a-z]/.test(password),
      // Au moins 1 chiffre
      hasDigit: /\d/.test(password),
      // Au moins 1 caractère spécial
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)
    };
    validation.isValid = Object.values(validation).every(v => v === true);
    if (DebugConsole) console.log(`validatePassword("${password}") =>`, validation);
    return validation;
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
    if (DebugConsole) console.log(`updateFieldState(${input.id}, ${isValid}) Classes:`, input.className);
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
    if (DebugConsole) console.log('updateValidationMessage(${inputElement.id}): ${messageText} (isValid=${isValid})');
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
    const prenomValue  = prenom.value;
    const nomValue = nom.value;
    const address = addressInput.value;
    const city = villeInput.value;

    // Vérifie que tous les champs requis sont remplis
    const allFieldsFilled = prenomValue && nomValue && phone && email && address && city && postalCode && password;

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
    if (DebugConsole) console.log("Form validity checked =>", isFormValid);
  }

  /* ===============================
      LISTENERS SUR LES INPUTS - PRÉNOM & NOM
     =============================== */

  if (prenom) {
    prenom.addEventListener('input', () => {
      const value = prenom.value.trim();
      const isValid = value.length > 0; 
      updateFieldState(prenom, isValid); 
      checkFormValidity();
    });
  }

  if (nom) {
    nom.addEventListener('input', () => {
      const value = nom.value.trim();
      const isValid = value.length > 0; 
      updateFieldState(nom, isValid); 
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
      
      updateFieldState(phoneInput, isValid);
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
      updateFieldState(emailInput, isValid); 
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
      updateFieldState(postalInput, isValid); 
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
     =============================== */
  if (addressInput) {
    addressInput.addEventListener('input', () => {
      const value = addressInput.value.trim();
      const isValid = value.length > 0;
      updateFieldState(addressInput, isValid); 
      checkFormValidity();
    });
  }

  if (villeInput) {
    villeInput.addEventListener('input', () => {
      const value = villeInput.value.trim();
      const isValid = value.length > 0;
      updateFieldState(villeInput, isValid); 
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
      updateFieldState(passwordInput, validation.isValid); 
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
      if (DebugConsole) console.log(" Champ du password =>", passwordInput.type);
    });
  }

  /* ===============================
      GESTION DE LA SOUMISSION DU FORMULAIRE
     =============================== */
  
  if (inscriptionForm) {
    inscriptionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // si déjà envoi, on bloque tout
      if (isSubmitting) return; 
      isSubmitting = true;
         
      // Désactive le bouton pendant l'envoi
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Inscription...';

      // Les validations ont déjà été faites, on peut envoyer
      // Mapping des champs HTML pour l'API Symfony
      const formData = {
        nom: nom.value,
        prenom: prenom.value,
        telephone: phoneInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        pays: 'France',
        ville: villeInput.value,
        code_postal: postalInput.value,
        adresse_postale: addressInput.value,
        site_web: ''  // Honeypot : toujours vide pour un vrai utilisateur
      };

      if (DebugConsole) console.log("Form data to submit:", formData);

      try {
        const response = await fetch(apiInscriptionUser, {
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
          // Succès on redirige vers la page de connexion
          //alert("Compte créé avec succès ! "+prenom.value+", vous êtes maintenant inscrit, Vous pouvez maintenant vous connecter.");
          if(DebugConsole){
            console.log("Utilisateur inscrit :", {
              prenom: prenom.value,
              nom: nom.value,
              email: emailInput.value
            });

          }
          window.location.href = '/login';
        } else {
          // Erreur retournée par l'API (400, 409...)
          alert(data.message || 'Erreur lors de l\'inscription.');
          if (DebugConsole) console.warn("Erreur inscription:", data);
        }
      } catch (err) {
        if(DebugConsole){
          console.error("Erreur réseau :", {
            err
          });
        }
        alert('Impossible de contacter le serveur. Vérifiez que l\'API est lancée.');

      } finally {

        // Réactive le bouton dans tous les cas
        isSubmitting = false; // reset flag
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="bi bi-person-fill-add me-2"></i> Créer mon compte';
        checkFormValidity();
      }
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
  if (DebugConsole) console.log("Inscription page initialisée avec DebugConsole activé.");
}