import { API_URL } from '../config.js';
import { getToken, getRole } from '../script.js';

export function initCommanderPage() {

  /* ===============================
    SCRIPT PAGE COMMANDER (multi-étapes)
    permet de réunir mes 4 anciennes page en une seule 
    1. page d'information name lastname etc.. voir figma
    2. livraison informations
    3. Choix menu et récapitulatif rapide
    4. page de validation avec rappel commande 
    simplifie les choses évite les duplications de code.
    =============================== */

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
      =============================== */

  // Sélectionne toutes les pastilles du stepper (étapes 1, 2, 3)
  const steps = document.querySelectorAll('.commander-step');
  // Sélectionne tous les panels (contenu de chaque étape)
  const panels = document.querySelectorAll('.commander-panel');
  // Select du choix de menu (étape 3)
  const menuSelect = document.getElementById('CommandMenu');
  // Input nombre de personnes (étape 3)
  // Input Form
  const personsInput = document.getElementById('CommandPersons');
  const firstNameInput = document.getElementById('CommandFirstName');
  const lastNameInput = document.getElementById('CommandLastName');
  const phoneInput = document.getElementById('CommandPhone');
  const addressInput = document.getElementById('CommandAddress');
  const cityInput = document.getElementById('CommandCity');
  const postalInput = document.getElementById('CommandPostal');

  // Stocker les valeurs originales pour comparer
  let originalData = {};

  // Vérifier chaque champ avant de l'assigner
  if (firstNameInput && firstNameInput.value) {
    originalData.prenom = firstNameInput.value;
  } else {
    originalData.prenom = '';
  }

  if (lastNameInput && lastNameInput.value) {
    originalData.nom = lastNameInput.value;
  } else {
    originalData.nom = '';
  }

  if (phoneInput && phoneInput.value) {
    originalData.telephone = phoneInput.value;
  } else {
    originalData.telephone = '';
  }

  if (addressInput && addressInput.value) {
    originalData.adresse_postale = addressInput.value;
  } else {
    originalData.adresse_postale = '';
  }

  if (cityInput && cityInput.value) {
    originalData.ville = cityInput.value;
  } else {
    originalData.ville = '';
  }

  if (postalInput && postalInput.value) {
    originalData.code_postal = postalInput.value;
  } else {
    originalData.code_postal = '';
  }

  /* ===============================
    INITIALISATION DES VARIABLES
    =============================== */

  // Étape actuelle (1, 2, 3 ou 4)
  let currentStep = 1;

  // Variable pour stocker les frais de livraison calculés par l'API
  // Par défaut à 0 (= livraison gratuite)
  let deliveryFee = 0;

  // Variable debug console si à true
  let DebugConsole = true;

  /* ===============================
      CONFIGURATION API
      =============================== */
  // URL pour créer la commande 
  const apiCommander = `${API_URL}/api/commandes`;

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // URL pour la modification du profil
  const apiProfilUrl = `${API_URL}/api/client/profil`;

  // URL pour la géolocalisation
  const apigeocodeUrl = `${API_URL}/geocode/delivery-cost?adresse=`;
  

  // Récupère le token JWT depuis le cookie (géré par script.js)
  const token = getToken();

  if (!token) {
    console.error('Pas de token, impossible de charger les commandes');
    return;
  }

  // Headers réutilisables pour toutes les requêtes authentifiées
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG initCommanderPage ===");
    console.log("API_URL                      :", API_URL);
    console.log("apiMeUrl                     :", apiMeUrl);
    console.log("apiCommander                 :", apiCommander);
    console.log("apiProfilUrl                 :", apiProfilUrl);
    console.log("Cookies actuels              :", document.cookie);
    console.log("Token actuel                 :", token);
    console.log("Rôle actuel                  :", getRole());
    console.log("originalData.prenom          :", originalData.prenom);
    console.log("originalData.nom             :", originalData.nom);
    console.log("originalData.telephone       :", originalData.telephone);
    console.log("originalData.adresse_postale :", originalData.adresse_postale);
    console.log("originalData.ville           :", originalData.ville);    
    console.log("originalData.code_postal     :", originalData.code_postal);   
    console.log("========================");
  }

  /* ===============================
     FONCTION : AFFICHER UNE ÉTAPE
     - Cache tous les panels
     - Affiche uniquement le panel demandé
     - Met à jour les pastilles du stepper (active / completed)
     - Cache le stepper à l'étape 4 (page de confirmation)
     =============================== */
  if (DebugConsole) console.log("[showStep] AFFICHER UNE ÉTAPE");

  function showStep(stepNumber) {
    // Cache tous les panels
    panels.forEach(panel => panel.classList.add('d-none'));

    // Affiche le panel correspondant à l'étape demandée
    const targetPanel = document.getElementById(`step-${stepNumber}`);
    if (targetPanel) targetPanel.classList.remove('d-none');

    // Cache le stepper à l'étape 4 (confirmation) car on n'en a plus besoin
    const stepper = document.querySelector('.commander-stepper');
    if (stepNumber === 4) {
      stepper.classList.add('d-none');
    } else {
      stepper.classList.remove('d-none');
    }
    if (DebugConsole) console.log("[showStep] stepper:",stepper);

    // Met à jour le stepper :
    // - Les étapes avant l'étape actuelle : classe "completed"
    // - L'étape actuelle : classe "active"
    // - Les étapes après : aucune classe spéciale
    steps.forEach(step => {
      const num = parseInt(step.dataset.step);
      step.classList.remove('active', 'completed');

      if (num < stepNumber) {
        step.classList.add('completed');
      } else if (num === stepNumber) {
        step.classList.add('active');
      }
      if (DebugConsole) {
      console.log("=== DEBUG showStep ===");
      console.log("num        :", num);
      console.log("stepNumber :", stepNumber);
     }
    });

    // Met à jour la variable qui mémorise l'étape en cours
    currentStep = stepNumber;
    if (DebugConsole) console.log("[showStep] currentStep:",currentStep);
  }

  /* ===============================
     FONCTION : VÉRIFIER QUE LES CHAMPS SONT REMPLIS
     - Récupère le formulaire de l'étape donnée..
     - Vérifie que tous les champs "required" ont une valeur non vide.
     - Retourne true si tout est valide, false sinon.
     =============================== */

  function isStepValid(stepNumber) {
    if (DebugConsole) console.log("[isStepValid] VÉRIFIER LES CHAMPS ");
    // Récupère le formulaire de l'étape
    const form = document.getElementById(`form-step-${stepNumber}`);

    // Si pas de formulaire pour cette étape ex étape 3, on considère valide
    if (!form) return true;

    // Sélectionne tous les champs avec l'attribut required
    const inputs = form.querySelectorAll('input[required], select[required]');
    let valid = true;

    // Vérifie que chaque champ a une valeur non vide
    inputs.forEach(input => {
      if (input.value === undefined || input.value === null || input.value === '') {
        valid = false;
      } else if (input.value.trim() === '') {
        valid = false;
      }else{
        valid = true;
      }
    });
    if (DebugConsole) console.log("[isStepValid] valid:",valid);
    return valid;
  }

  /* ===============================
     FONCTION : MET A JOUR LE PROFIL SI CHAMP MODIFIER
     - 
     =============================== */
  async function updateUserIfChanged() {
    // Stocker les valeurs actuelles
    let currentData = {};

    // Vérifier chaque champ et assigner la valeur ou une chaîne vide
    if (firstNameInput && firstNameInput.value) {currentData.prenom = firstNameInput.value;} else {
      currentData.prenom = '';
    }
    if (lastNameInput && lastNameInput.value) {currentData.nom = lastNameInput.value;} else {
      currentData.nom = '';
    }

    if (phoneInput && phoneInput.value) {currentData.telephone = phoneInput.value;} else {
      currentData.telephone = '';
    }

    if (addressInput && addressInput.value) {currentData.adresse_postale = addressInput.value;} else {
      currentData.adresse_postale = '';
    }

    if (cityInput && cityInput.value) {currentData.ville = cityInput.value;} else {
      currentData.ville = '';
    }

    if (postalInput && postalInput.value) {currentData.code_postal = postalInput.value;} else {
      currentData.code_postal = '';
    }

    // Vérifier si quelque chose a changé
    let changed = false;
    if (currentData.prenom !== originalData.prenom) {
      changed = true;
    } else if (currentData.nom !== originalData.nom) {
      changed = true;
    } else if (currentData.telephone !== originalData.telephone) {
      changed = true;
    } else if (currentData.email !== originalData.email) {
      changed = true;
    } else if (currentData.adresse_postale !== originalData.adresse_postale) {
      changed = true;
    } else if (currentData.ville !== originalData.ville) {
      changed = true;
    } else if (currentData.code_postal !== originalData.code_postal) {
      changed = true;
    }

    if (!changed) {
      if (DebugConsole) console.log("[updateUserIfChanged] Pas de modification détectée");
      return;
    }else{
      if (DebugConsole) console.log("[updateUserIfChanged] Données modifiées, envoi PUT...", currentData);
    }

    try {
      const response = await fetch(apiProfilUrl, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(currentData)
      });
      
      let result = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (response.ok) {
        if (DebugConsole) console.log("[updateUserIfChanged] Profil mis à jour avec succès");
        // Met à jour les valeurs originales pour la prochaine comparaison
        originalData = { ...currentData };
      } else {
        console.error('[updateUserIfChanged] Erreur mise à jour profil:', result.message);
      }
    } catch (err) {
      console.error('[updateUserIfChanged] Erreur réseau:', err);
    }
  }

  /* ===============================
     FONCTION : CALCULER LES FRAIS DE LIVRAISON VIA L'API BACK
     - Construit l'adresse complète à partir des champs de l'étape 2
     - Appelle l'endpoint /delivery-cost de notre API Symfony
     - Rappel de L'API :
      géocodage Nominatim -> distance OSRM -> calcul tarif
     - Stocke le résultat dans la variable deliveryFee
     - Règle tarifaire :
         • ≤ 50 km du restaurant ->  livraison gratuite (0€)
         • > 50 km ->  5€ + 0.59€ par km
     =============================== */

  async function calculateDeliveryFee() {
    if (DebugConsole) console.log("[calculateDeliveryFee] CALCUL DES FRAIS DE LIVRAISON");
    // Récupère les valeurs saisies par le client à l'étape 2
    let address = '';
    let city = '';
    let postal = '';
    // Vérifier chaque champ
    if (addressInput && addressInput.value) {
      address = addressInput.value;
    }
    if (cityInput && cityInput.value) {
      city = cityInput.value;
    }

    if (postalInput && postalInput.value) {
      postal = postalInput.value;
    }
    // Construit l'adresse complète au format attendu par Nominatim
    // Exemple : "12 rue des Roses, 33000 Bordeaux, France"
    const fullAddress = `${address}, ${postal} ${city}, France`;

    try {
      // Appel GET vers endpoint Symfony /delivery-cost
      // Le back va :
      //   1. Géocoder cette adresse via Nominatim (latitude et longitude)
      //   2. Calculer la distance routière via OSRM
      //   3. Appliquer la règle tarifaire
      //   4. Retourner le JSON avec frais_livraison
      const response = await fetch(
        `apigeocodeUrl${encodeURIComponent(fullAddress)}`
      );

      // Si la réponse n'est pas OK (400, 404, 500...), on met les frais à 0
      if (!response.ok) {
        if (DebugConsole) console.log("[calculateDeliveryFee] érreur d'accès à l'api");
        console.error('Erreur API livraison:', response.status);
        deliveryFee = 0;
        return;
      }
      if (DebugConsole) console.log("[calculateDeliveryFee] Réponse de l'API");

      // Parse la réponse JSON de l'API
      let data = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // Stocke les frais de livraison retournés par l'API
      // data.frais_livraison contient soit 0 (gratuit) soit le montant calculé
      deliveryFee = data.frais_livraison || 0;

      if (DebugConsole) {
        console.log('Distance:', data.distance_km, 'km (' + data.distance_type + ')');
        console.log('Type distance:', data.distance_type);
        console.log('Frais livraison:', deliveryFee, '€');
      }

    } catch (err) {
      // En cas d'erreur réseau
      // On met les frais à 0 par sécurité (gratuit par défaut)
      console.error('Erreur réseau calcul livraison:', err);
      deliveryFee = 0;
    }
  }

  /* ===============================
     FONCTION : MISE À JOUR DU STEPPER "LE RÉCAPITULATIF PRIX"
     - 1. Récupère le menu sélectionné et son prix unitaire
     - 2. Calcule le sous-total (prix unitaire × nombre de personnes)
     - 3. Ajoute les frais de livraison (calculés par calculateDeliveryFee)
     - 4. Met à jour tous les éléments du récapitulatif dans le DOM
     =============================== */

  /* ===============================
     FONCTION : METTRE À JOUR LE RÉCAPITULATIF PRIX
     =============================== */

  function updateRecapPrices() {

    if (DebugConsole) console.log("[updateRecapPrices] MISE À JOUR RÉCAPITULATIF PRIX");

    // Récupère l'option sélectionnée dans le select menu
    let selectedOption;
    if (menuSelect && menuSelect.options && menuSelect.selectedIndex >= 0) {
      selectedOption = menuSelect.options[menuSelect.selectedIndex];
    } else {
      selectedOption = null;
    }
    if (DebugConsole) console.log("[updateRecapPrices] selectedOption:", selectedOption);

    // Nom du menu (ex: "Festin de Noël Traditionnel")
    let menuName;
    if (selectedOption && selectedOption.text) {
      menuName = selectedOption.text;
    } else {
      menuName = '—';
    }
    if (DebugConsole) console.log("[updateRecapPrices] menuName:", menuName);

    // Prix unitaire stocké dans l'attribut data-price du <option>
    let unitPrice;
    if (selectedOption && selectedOption.dataset && selectedOption.dataset.price) {
      unitPrice = parseFloat(selectedOption.dataset.price);
      if (isNaN(unitPrice)) {
        unitPrice = 0;
      }
    } else {
      unitPrice = 0;
    }
    if (DebugConsole) console.log("[updateRecapPrices] unitPrice:", unitPrice);

    // Nombre de personnes saisi par le client
    let persons;
    if (personsInput && personsInput.value) {
      persons = parseInt(personsInput.value);
      if (isNaN(persons)) {
        persons = 0;
      }
    } else {
      persons = 0;
    }
    if (DebugConsole) console.log("[updateRecapPrices] persons:", persons);

    // Sous-total = prix unitaire × nombre de personnes
    const subtotal = unitPrice * persons;
    if (DebugConsole) console.log("[updateRecapPrices] subtotal:", subtotal);

    // Total TTC = sous-total des menus + frais de livraison
    const total = subtotal + deliveryFee;
    if (DebugConsole) console.log("[updateRecapPrices] total:", total);

    // Récupère les éléments du DOM pour afficher le récapitulatif
    const recapMenuName = document.getElementById('recap-menu-name');
    const recapUnitPrice = document.getElementById('recap-unit-price');
    const recapPersons = document.getElementById('recap-persons');
    const recapSubtotal = document.getElementById('recap-subtotal');
    const recapDelivery = document.getElementById('recap-delivery');
    const recapTotal = document.getElementById('recap-total');

    // Mise à jour de chaque ligne du récapitulatif
    if (recapMenuName) recapMenuName.textContent = menuName;
    if (recapUnitPrice) {
      if (unitPrice && !isNaN(unitPrice)) {
        recapUnitPrice.textContent = unitPrice + '€/pers.';
      } else {
        recapUnitPrice.textContent = '—';
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapUnitPrice:", recapUnitPrice);

    if (recapPersons) recapPersons.textContent = persons || '—';
    if (DebugConsole) console.log("[updateRecapPrices] recapPersons:", recapPersons);

    if (recapSubtotal) {
      if (subtotal !== undefined && subtotal !== null && !isNaN(subtotal) && subtotal !== 0) {
        recapSubtotal.textContent = subtotal.toFixed(2) + '€';
      } else {
        recapSubtotal.textContent = '—';
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapSubtotal:", recapSubtotal);

    // Affiche "Gratuite" si 0€, sinon affiche le montant des frais
    if (recapDelivery) {
      if (deliveryFee !== undefined && deliveryFee !== null && !isNaN(deliveryFee) && deliveryFee > 0) {
        recapDelivery.textContent = deliveryFee.toFixed(2) + '€';
      } else {
        recapDelivery.textContent = 'Gratuite';
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapDelivery:", recapDelivery);

    // Total TTC = sous-total + livraison
    if (recapTotal) {
      if (total !== undefined && total !== null && !isNaN(total) && total !== 0) {
        recapTotal.textContent = total.toFixed(2) + '€';
      } else {
        recapTotal.textContent = '—';
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapTotal:", recapTotal);
  }

  /* ===============================
    FONCTION : GÉNÉRER UN NUMÉRO DE COMMANDE
    - Crée un identifiant unique au format CMD-ANNÉE-XXXX
    - XXXX = nombre aléatoire à 4 chiffres
    - Utilisé uniquement pour l'affichage côté front
    - En production, l'ID viendra de l'API back
    =============================== */

  function generateOrderId() {
    if (DebugConsole) console.log("[generateOrderId] GÉNÉRER UN NUMÉRO DE COMMANDE:");
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    if (DebugConsole) console.log("[generateOrderId] nb_cmd:",`CMD-${year}-${random}`);
    return `CMD-${year}-${random}`;
  }

  /* ===============================
     FONCTION : AFFICHE LA PAGE DE CONFIRMATION (ÉTAPE 4)
     - 1. Récupère toutes les infos saisies dans les étapes précédentes
     - 2. Calcule le total final (menus + livraison)
     - 3. Remplit les champs de la page de confirmation
     - 4. Affiche l'étape 4
     =============================== */

  function showConfirmation() {
    if (DebugConsole) console.log("[showConfirmation] AFFICHE LA PAGE DE CONFIRMATION:");
    // Récupère les infos du menu sélectionné
    let selectedOption;
    if (menuSelect && menuSelect.options && menuSelect.selectedIndex >= 0) {
      selectedOption = menuSelect.options[menuSelect.selectedIndex];
    } else {
      selectedOption = null;
    }
    if (DebugConsole) console.log("[showConfirmation] selectedOption:", selectedOption);

    let menuName;
    if (selectedOption && selectedOption.text) {
      menuName = selectedOption.text;
    } else {
      menuName = '—';
    }
    if (DebugConsole) console.log("[showConfirmation] menuName:", menuName);

    let persons;
    if (personsInput && personsInput.value) {
      persons = personsInput.value;
    } else {
      persons = '—';
    }
    if (DebugConsole) console.log("[showConfirmation] persons:", persons);

    // Récupère la date et l'heure saisies à l'étape 2
    let date = '';
    let time = '';

    const dateInput = document.getElementById('CommandDate');
    if (dateInput && dateInput.value) {
      date = dateInput.value;
    }
    if (DebugConsole) console.log("[showConfirmation] date:", date);

    const timeInput = document.getElementById('CommandTime');
    if (timeInput && timeInput.value) {
      time = timeInput.value;
    }
    if (DebugConsole) console.log("[showConfirmation] time:", time);

    // Calcule le total final : (prix unitaire × personnes) + frais de livraison
    let unitPrice = 0;
    if (selectedOption && selectedOption.dataset && selectedOption.dataset.price) {
      unitPrice = parseFloat(selectedOption.dataset.price);
      if (isNaN(unitPrice)) {
        unitPrice = 0;
      }
    }
    if (DebugConsole) console.log("[showConfirmation] unitPrice:", unitPrice);

    const total = (unitPrice * parseInt(persons) + deliveryFee).toFixed(2);

    // Récupère les éléments du DOM de la page confirmation
    const confirmOrderId = document.getElementById('confirm-order-id');
    const confirmMenu = document.getElementById('confirm-menu');
    const confirmPersons = document.getElementById('confirm-persons');
    const confirmDate = document.getElementById('confirm-date');
    const confirmTotal = document.getElementById('confirm-total');

    // Remplit chaque champ de la confirmation
    if (confirmOrderId) confirmOrderId.textContent = generateOrderId();
    if (confirmMenu) confirmMenu.textContent = menuName;
    if (confirmPersons) confirmPersons.textContent = persons;
    if (confirmDate) confirmDate.textContent = `${date} à ${time}`;
    if (confirmTotal) confirmTotal.textContent = `${total}€`;

    if (DebugConsole) {
      console.log("=== showConfirmation ===");
      console.log("confirmOrderId :", confirmOrderId);
      console.log("confirmMenu    :", confirmMenu);
      console.log("confirmPersons :", confirmPersons);
      console.log("confirmDate    :", confirmDate);
      console.log("confirmTotal   :", confirmTotal);
      console.log("========================");
    }

    // Affiche l'étape 4 (confirmation)
    showStep(4);
  }

  /* ===============================
     LISTENERS : MENU & PERSONNES
     - 1. Mise à jour du récap en temps réel
     - 2. Dès que le client change le menu ou le nombre de personnes,
       le récapitulatif se recalcule automatiquement
     =============================== */

  if (menuSelect) {
    menuSelect.addEventListener('change', updateRecapPrices);
  }
  if (DebugConsole) console.log("[LISTENERS] menuSelect:", menuSelect);

  if (personsInput) {
    personsInput.addEventListener('input', updateRecapPrices);
  }
  if (DebugConsole) console.log("[LISTENERS] personsInput:", personsInput);

  /* ===============================
     LISTENERS : BOUTONS SUIVANT
     - Étape 1 -> 2 : vérifie que les infos personnelles sont remplies
     - Étape 2 -> 3 : vérifie l'adresse, PUIS calcule les frais de livraison
       via l'API avant d'afficher le récap
     =============================== */

  // Bouton "Étape suivante" de l'étape 1 (Informations -> Livraison)
  const btnNext1 = document.getElementById('btn-next-1');
  if (btnNext1) {
    btnNext1.addEventListener('click', async () => {

      // Vérifie que tous les champs required de l'étape 1 sont remplis
      if (isStepValid(1)) {
        // Sauvegarde le profil si modifié avant de passer à l'étape suivante
        await updateUserIfChanged();
        // Passe à l'étape 2
        showStep(2);
      }
    });
  }
  if (DebugConsole) console.log("[LISTENERS] btnNext1:", btnNext1);

  // Bouton "Étape suivante" de l'étape 2 (Livraison -> Menu & Récap)
  // CE LISTENER est async car on attend le retour de l'API
  // avant d'afficher l'étape 3 avec les frais de livraison calculés
  const btnNext2 = document.getElementById('btn-next-2');
  if (btnNext2) {
    btnNext2.addEventListener('click', async () => {

      // Vérifie que tous les champs required de l'étape 2 sont remplis
      if (isStepValid(2)) {
        // 1. Appelle l'API /delivery-cost pour calculer les frais
        //  Cette fonction met à jour la variable deliveryFee
        await calculateDeliveryFee();

        // 2. Une fois les frais calculés, affiche l'étape 3
        showStep(3);

        // 3. Met à jour le récapitulatif avec les frais de livraison inclus
        updateRecapPrices();
      }
    });
    if (DebugConsole) console.log("[LISTENERS] btnNext2:", btnNext2);
  }

  /* ===============================
     LISTENERS : BOUTONS RETOUR
     - Permettent de revenir à l'étape précédente
     =============================== */

  // Bouton "Retour" de l'étape 2,  retour à l'étape 1
  const btnPrev2 = document.getElementById('btn-prev-2');
  if (btnPrev2) {
    btnPrev2.addEventListener('click', () => {
      showStep(1);
    });
    if (DebugConsole) console.log("[LISTENERS] btnPrev2:", btnPrev2);
  }

  // Bouton "Retour" de l'étape 3,  retour à l'étape 2
  const btnPrev3 = document.getElementById('btn-prev-3');
  if (btnPrev3) {
    btnPrev3.addEventListener('click', () => {
      showStep(2);
    });
    if (DebugConsole) console.log("[LISTENERS] btnPrev3:", btnPrev3);
  }

  /* ===============================
     LISTENER : BOUTON CONFIRMER LA COMMANDE
     - 1. Collecte toutes les données du formulaire multi-étapes
     - 2. En production : envoie les données à l'API POST /api/orders
     - 3. Pour l'instant : log en console + affiche la confirmation
     =============================== */

  const btnSubmit = document.getElementById('btn-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', async  () => {
      // Collecte toutes les données saisies dans les 3 étapes
      const formData = {
        menu_id: parseInt(menuSelect.value),
        date_prestation: dateInput.value,
        heure_livraison: timeInput.value,
        nombre_personnes: parseInt(personsInput.value),
        adresse_livraison: addressInput.value,
        ville_livraison: cityInput.value,
        pret_materiel: materialCheckbox.checked
      };

      if (DebugConsole) console.log("Commande confirmée:", formData);
      try {
        const response = await fetch(apiCommander, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(formData)
        });

        if (DebugConsole) console.log("[submitCommande] Réponse de l'API");

        // Parse la réponse JSON de l'API
        let data = null;
        // évite que le script crash si la réponse n'est pas du JSON
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        if (response.ok) {
          // La commande a été créée avec succès
          if (DebugConsole) console.log("[submitCommande] Commande créée :", data);
        } else {
          // Erreur côté API
          console.error('Erreur création commande :', data.message);
          alert(`Erreur : ${data.message}`);
        }
      } catch (err) {
        // Erreur réseau
        console.error('Erreur réseau :', err);
        alert('Erreur réseau, merci de réessayer.');
      }
      // Affiche la confirmation à l'utilisateur
      showConfirmation(data || '');
    });
  }

  /* ===============================
     INITIALISATION : AFFICHER L'ÉTAPE 1
     - Au chargement de la page, on affiche toujours l'étape 1
     =============================== */

  showStep(1);
}