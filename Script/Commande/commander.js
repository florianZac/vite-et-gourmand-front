import { API_URL } from '../config.js';
import { getToken, getRole, sanitizeInput, getSanitizedFormData, sanitizeHtml } from '../script.js';

export async function initCommanderPage() {

  /* ===============================
    SCRIPT PAGE COMMANDER (multi-étapes)
    permet de réunir mes 4 anciennes page en une seule 
    1. page d'information name lastname etc.. voir figma
    2. livraison informations
    3. Choix menu et récapitulatif rapide
    4. page de validation avec rappel commande 
    simplifie les choses évite les duplications de code.
    RAPPEL REGLE METIER BACK :
      Crée une nouvelle commande avec toutes les règles métier : 
      délai minimum (3j ouvrables, 14j si >20 pers.), 
      acompte 30% ou 50% (événement, mariage), 
      livraison gratuite Bordeaux + 10km ,livraison max 200km, sinon 5€+0.59€/km , 
      réduction -10% si pers. > min+5, vérification stock.
    =============================== */

  /* ===============================
      INITIALISATION DES VARIABLES ET TOKEN 
     =============================== */

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

  // Étape actuelle (1, 2, 3 ou 4)
  let currentStep = 1;

  // Valeur du nombre jour max entre la date actuel et la date de prestation de la cmd
  const nb_jourDate = 3;

  // Variable pour stocker les frais de livraison calculés par l'API
  // Par défaut à 0 (= livraison gratuite)
  let deliveryFee = 0;

  // variable globale pour stocker la distance
  let deliveryDistanceKm = 0; 
  
  // Récupération des horraires du site
  let horaires = [];

  // Variable debug console si à true
  let DebugConsole = true;
  
  let isModified = false;

  /* ===============================
      CONFIGURATION API
      =============================== */

  // EndPoint de l'API pour créer la commande 
  const apiCommander = `${API_URL}/api/commandes`;

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération des menus
  const apiMenusUrl = `${API_URL}/api/menus`;

  // EndPoint de l'API pour la modification du profil
  const apiProfilUrl = `${API_URL}/api/client/profil`;

  // EndPoint de l'API pour la géolocalisation et le calcul du coup vias la distance
  const apigeocodeUrl = `${API_URL}/api/delivery-cost?adresse=`;
  
  // EndPoint de l'API pour la récupération des horraires du site
  const apiHorraireUrl = `${API_URL}/api/horaires`;

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
  // Input Formulaire
  const personsInput = document.getElementById('CommandPersons');
  const firstNameInput = document.getElementById('CommandFirstName');
  const lastNameInput = document.getElementById('CommandLastName');
  const phoneInput = document.getElementById('CommandPhone');
  const addressInput = document.getElementById('CommandAddress');
  const cityInput = document.getElementById('CommandCity');
  const postalInput = document.getElementById('CommandPostal');
  const dateInput = document.getElementById('CommandDate');
  const timeInput = document.getElementById('CommandTime');

  //Inputs de l'adresse de livraison (étape 2)
  const sameAddressCheckbox = document.getElementById('CommandSameAddress');
  const deliveryFieldsContainer = document.getElementById('delivery-address-fields');
  const deliveryAddressInput = document.getElementById('CommandDeliveryAddress');
  const deliveryCityInput = document.getElementById('CommandDeliveryCity');
  const deliveryPostalInput = document.getElementById('CommandDeliveryPostal');
  
  // Toast Bootstrap
  const toastEl = document.getElementById('toast-message');
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 4000 });

  // checkbox
  const materialCheckbox = document.getElementById('CommandMaterial');
  // Stockage des données originales pour comparaison
  let originalData = {};
 
  if (DebugConsole) {
    console.log("=== DEBUG CONFIG initCommanderPage ===");
    console.log("API_URL                      :", API_URL);
    console.log("apiMeUrl                     :", apiMeUrl);
    console.log("apiCommander                 :", apiCommander);
    console.log("apiProfilUrl                 :", apiProfilUrl);
    console.log("Cookies actuels              :", document.cookie);
    console.log("Token actuel                 :", token);
    console.log("URL complète                 :", window.location.href);
    console.log("SEARCH                       :", window.location.search);
    console.log("menu_id récupéré             :", getMenuIdFromUrl());
    console.log("========================");
  }

  /* ===============================
      FONCTION : TOAST BOOTSTRAP POUR ENVOYER LES MESSAGES AU CLIENTS
        Déplace l'affichage en fonction de l'étape sous les btns
        gere la version Erreur / et Success
      Exemple d'utilisation :
        showToast("Erreur Prénom ",'error');
        showToast("Prénom modifié ",'success');
     =============================== */

  function showToast(message, type = 'error') {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = sanitizeHtml(message || "Action effectuée !");

    toastEl.classList.remove('toast-success', 'toast-error');
    toastEl.classList.add(type === 'error' ? 'toast-error' : 'toast-success');

    toastBootstrap.show();
  }

  /* ===============================
      FONCTION : RECUPERATION DES HORRAIRES DU SITE
     =============================== */
  async function getHoraires() {
    try {
      const response = await fetch(apiHorraireUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur horaires');

      // évite que le script crash si la réponse n'est pas du JSON
      try {
        horaires  = await response.json();
      } catch {
      horaires = [];
      }

      if (DebugConsole) console.log("[getHoraires] Horaires chargés :", horaires);

    } catch (err) {
      console.error("Erreur récupération horaires :", err);
      showToast("Erreur API getHoraires ",'error');
      horaires = [];
    }
  }

  /* ===============================
      FONCTION : VALIDATION DES HORRAIRES
     =============================== */
  function isHoraireValide(dateValue, timeValue) {
    if (!dateValue || !timeValue) return false;

      if (!horaires || horaires.length === 0) {
        showToast("Horaires non disponibles",'error');
        return false;
      }
      const date = new Date(dateValue);
      const jour = date.toLocaleDateString('fr-FR', { weekday: 'long' });

      // 1er lettre en Majuscule d'après retour APi
      const jourCapitalized = jour.charAt(0).toUpperCase() + jour.slice(1);
      const horaireJour = horaires.find(h => h.jour === jourCapitalized);

        if (!horaireJour) {
        showToast("Jour non disponible",'error');
        return false;
      }

      // Gestion du cas fermé
      if (horaireJour.heureOuverture === "Fermé") {
        showToast("Nous sommes fermés ce jour-là",'error');
        return false;
      }

      const [h, m] = timeValue.split(':').map(Number);
      const selectedMinutes = h * 60 + m;
      const [openH, openM] = horaireJour.heureOuverture.split(':').map(Number);
      const [closeH, closeM] = horaireJour.heureFermeture.split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (DebugConsole) console.log("[isHoraireValide] Horaires :",[h, m] ,selectedMinutes,[openH, openM],[closeH, closeM],openMinutes,closeMinutes);

      if (selectedMinutes < openMinutes || selectedMinutes >= closeMinutes) {
        if (DebugConsole) console.log("[isHoraireValide] Heure invalide",`${horaireJour.heureOuverture} - ${horaireJour.heureFermeture}`);
        showToast(
          `Heure invalide (${horaireJour.heureOuverture} - ${horaireJour.heureFermeture})`,'success'
        );
        return false;
      }
      if (DebugConsole) console.log("[isHoraireValide] Heure : ok");
      return true;
    }

  /* ===============================
      FONCTION : CHARGE LES MENUS POUR LE SELECT
     =============================== */
  async function loadMenus() {
    if (DebugConsole) console.log("[loadMenus] Début - Appel GET", apiMenusUrl);

    try {
      // Requête GET vers l'API pour récupérer tous les menus
      const response = await fetch(apiMenusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (DebugConsole) console.log("[loadMenus] Réponse status :", response.status);

      if (!response.ok) {
        console.error('[loadMenus] Erreur chargement menus:', response.status);
        return;
      }

      // Parse la réponse JSON
      let menus  = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        menus  = await response.json();
      } catch {
        menus  = {};
      }

      if (!menuSelect) return;

      menuSelect.innerHTML = '';
      const menusArray = menus.menus || []; 
      menusArray.forEach(menu => {
        const option = document.createElement('option');
        option.value = menu.id;
        option.textContent = sanitizeHtml(menu.titre);      
        option.dataset.price = menu.prix_par_personne;
        option.dataset.minPersons = menu.nombre_personne_minimum || 1;
        option.dataset.theme = menu.theme?.titre || 'autre';
        menuSelect.appendChild(option);
      });

      if (DebugConsole) {
        console.log("[loadMenus] Données reçues :", menusArray);
      }

      // autoSelectMenuFromUrl appelle prefillPersonsMin + updateRecapPrices
      // fallback si pas de menu_id dans l'URL
      autoSelectMenuFromUrl();

      // Si aucun menu_id dans l'URL, on pré-remplit quand même avec le 1er menu
      if (!getMenuIdFromUrl() && menuSelect.selectedIndex >= 0) {
        prefillPersonsMin(menuSelect.options[menuSelect.selectedIndex]);
      }

      updateRecapPrices();

    } catch (err) {
      console.error("[loadMenus] Erreur réseau :", err);
    }
  }

  /* ===============================
      FONCTION : RECUPERATION DU MENU ID PAR L'URL
     =============================== */
  function getMenuIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('menu_id'); // renvoie l'ID ou null si absent
  }

  /* ===============================
      FONCTION : SELECTION DU SELECT POUR L'ETAPE 3 AVEC L'4'ID MENU
     =============================== */
  function autoSelectMenuFromUrl() {
    if (!menuSelect) return;
    const menuIdFromUrl = getMenuIdFromUrl();
    if (!menuIdFromUrl) return;

    const optionExists = Array.from(menuSelect.options).some(
      opt => opt.value === menuIdFromUrl
    );

    if (optionExists) {
      menuSelect.value = menuIdFromUrl;
      if (DebugConsole) console.log("[autoSelectMenuFromUrl] Menu auto sélectionné :", menuIdFromUrl);
      prefillPersonsMin(menuSelect.options[menuSelect.selectedIndex]);
      updateRecapPrices();
    }
  }

  /* ===============================
      FONCTION : CHARGE LE NB MIN D'UN MENU A L'ETAPE 3
     =============================== */
  function prefillPersonsMin(menuOption) {
    if (!menuOption) return;
    const minPersons = parseInt(menuOption.dataset.minPersons) || 10;
    const maxPersons = parseInt(menuOption.dataset.maxPersons) || 1000;

    personsInput.value = minPersons;
    personsInput.min = minPersons;
    personsInput.max = maxPersons;

    // éviter doublon
    personsInput.removeEventListener('input', handlePersonsInput);
    personsInput.addEventListener('input', handlePersonsInput);
  }

  /* ===============================
      FONCTION : CHARGEMENT DU PROFIL UTILISATEUR POUR REMPLIR LES PLACEHOLDER DES INPUTS
      - Met à jour les inputs nom, prènom, ville et code postale ...
     =============================== */
  await getHoraires();
  async function loadUserProfile() {
    if (DebugConsole) console.log("[loadUserProfile] CHARGEMENT DES INPUTS :");
    try {
      const response = await fetch(apiProfilUrl, {
        method: 'GET',
        headers: authHeaders
      });

      if (!response.ok) {
        console.error('Impossible de récupérer le profil :', response.status);
        if (DebugConsole) console.log("[loadUserProfile] Erreur chagement de l'api");
        return;
      }

      let data = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // Vérifie que la structure est correcte
      if (data && data.utilisateur) {
        const user = data.utilisateur;

        // Remplit les inputs
        if (firstNameInput) firstNameInput.value = sanitizeInput(user.prenom || '');
        if (lastNameInput) lastNameInput.value = sanitizeInput(user.nom || '');
        if (phoneInput) phoneInput.value = sanitizeInput(user.telephone || '');
        if (addressInput) addressInput.value = sanitizeInput(user.adresse_postale || '');
        if (cityInput) cityInput.value = sanitizeInput(user.ville || '');
        if (postalInput) postalInput.value = sanitizeInput(user.code_postal || '');

        // Mets à jour originalData pour comparaison
        originalData = {
          prenom: user.prenom || '',
          nom: user.nom || '',
          email: user.email || '',
          telephone: user.telephone || '',
          adresse_postale: user.adresse_postale || '',
          ville: user.ville || '',
          code_postal: user.code_postal || ''
        };

        if (DebugConsole) console.log("[loadUserProfile] Profil chargé :", originalData);
      }

    } catch (err) {
      console.error('Erreur récupération profil :', err);
    }
  }

  /* ===============================
      CHARGEMENT DU PROFIL AVANT INTERACTION
     ===============================*/
  await getHoraires();
  await loadUserProfile(); // charge les données du client
  await loadMenus();       // charge les menus de la BDD

  /* ===============================
      FONCTION : INITIALISATION DE L’ÉTAPE 1 
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
    if (!input.value || input.value.trim() === '') {
        valid = false; // si un champ vide, on invalide
        showToast('Les Champs Date et Heure sont requis','error');
      }
    });
    if (DebugConsole) console.log("[isStepValid] valid:",valid);
    return valid;
  }

  /* ===============================
      FONCTION : FONCTION UTILITAIRE POUR LA MISE A JOUR
     =============================== */
  function copyCurrentToOriginal(currentData) {
    originalData.prenom = currentData.prenom;
    originalData.nom = currentData.nom;
    originalData.telephone = currentData.telephone;
    originalData.adresse_postale = currentData.adresse_postale;
    originalData.ville = currentData.ville;
    originalData.code_postal = currentData.code_postal;
  }
  /* ===============================
      FONCTION : MET A JOUR LE PROFIL SI CHAMP MODIFIER
     =============================== */
  async function updateUserIfChanged() {
    // Stocker les valeurs actuelles
    if (!firstNameInput || !lastNameInput || !phoneInput || !addressInput || !cityInput || !postalInput) {
    if (DebugConsole) console.log("[updateUserIfChanged] Inputs manquants, skip");
    return;
  }
    const currentData = {
      prenom: sanitizeInput(firstNameInput.value),
      nom: sanitizeInput(lastNameInput.value),
      email: originalData.email || '',
      telephone: sanitizeInput(phoneInput.value),
      adresse_postale: sanitizeInput(addressInput.value),
      ville: sanitizeInput(cityInput.value),
      code_postal: sanitizeInput(postalInput.value),
      pays: 'France'// valeur fixe si non modifiable
    };

    // Vérifier si un champ a réellement changé
    let changed = false;
    if (currentData.prenom !== originalData.prenom) changed = true;
    else if (currentData.nom !== originalData.nom) changed = true;
    else if (currentData.telephone !== originalData.telephone) changed = true;
    else if (currentData.adresse_postale !== originalData.adresse_postale) changed = true;
    else if (currentData.ville !== originalData.ville) changed = true;
    else if (currentData.code_postal !== originalData.code_postal) changed = true;

    if (!changed) {
      if (DebugConsole) console.log("[updateUserIfChanged] Aucun changement détecté, skip PUT");
      return;
    }
    if (DebugConsole) console.log("[updateUserIfChanged] Données modifiées, envoi PUT...", currentData);
  
    try {
      const response = await fetch(apiProfilUrl, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(currentData)
      });
      
      let result = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        result = await response.json().catch(() => ({}));
      } catch {
        result = {};
      }

      if (response.ok) {

        if (DebugConsole) console.log("[updateUserIfChanged] Profil mis à jour avec succès");

        // Met à jour les valeurs originales pour la prochaine comparaison
        copyCurrentToOriginal(currentData);
        // Reset du flag
        isModified = false;
      } else {
        console.error('[updateUserIfChanged] Erreur mise à jour profil:', result.message);
        if (DebugConsole) console.log("[updateUserIfChanged] Erreur mise à jour profil:", result.message);
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
            - ≤ 50 km du restaurant -> livraison gratuite (0€)
            - > 50 km ->  5€ + 0.59€ par km
     =============================== */

  async function calculateDeliveryFee() {
    if (DebugConsole) console.log("[calculateDeliveryFee] CALCUL DES FRAIS DE LIVRAISON");
    // Récupère les valeurs saisies par le client à l'étape 2
    const delivery = getDeliveryAddress();
    const address = delivery.adresse;
    const city = delivery.ville;
    const postal = delivery.code_postal;
    const fullAddress = `${address}, ${postal} ${city}, France`;

    // Construit l'adresse complète au format attendu par Nominatim
    if (DebugConsole){
      console.log("fullAddress : ",fullAddress);
      console.log(" address :",`${address}`);
      console.log(" postal  :",`${postal}`);
      console.log(" city    :",`${city}`);
    } 
    try {
      // Appel GET vers endpoint Symfony /delivery-cost
      // Le back va :
      //   1. Géocoder cette adresse via Nominatim (latitude et longitude)
      //   2. Calculer la distance routière via OSRM
      //   3. Appliquer la règle tarifaire
      //   4. Retourner le JSON avec frais_livraison

      //const response = await fetch(`${apigeocodeUrl}${encodeURIComponent(fullAddress)}`);
      const encodedAdresse = encodeURIComponent(fullAddress);
      const url = `${apigeocodeUrl}${encodedAdresse}`;
      if (DebugConsole) {
        console.log("fullAddress    : ",fullAddress);
        console.log("encodedAdresse : ",encodedAdresse);
        console.log("Url            : ",url);
      }
       const response = await fetch(url);
      // Si la réponse n'est pas OK (400, 404, 500...), on met les frais à 0
      if (!response.ok) {
        if (DebugConsole) console.error('[calculateDeliveryFee] Erreur API livraison, status:', response.status);
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
      if (DebugConsole) console.log("[calculateDeliveryFee] data reçue:", data);

      // Stocke les frais de livraison retournés par l'API
      // data.frais_livraison contient soit 0 (gratuit) soit le montant calculé
      deliveryFee = (data.frais_livraison !== undefined && !isNaN(data.frais_livraison))
      ? parseFloat(data.frais_livraison)
      : 0;

      // Stocke la distance dans la variable globale
      deliveryDistanceKm = data.distance_km || 0;
      if (DebugConsole) {
        console.log("[calculateDeliveryFee] Distance:", data.distance_km || ' ', "km");
        console.log("[calculateDeliveryFee] Frais livraison:", deliveryFee, "€");
        console.log('Type distance:', data.distance_type);
      }
      
      // Mise à jour du récap après calcul
      updateRecapPrices();

    } catch (err) {
      // En cas d'erreur réseau
      // On met les frais à 0 par sécurité gratuit par défaut
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
  function updateRecapPrices() {

    if (DebugConsole) console.log("[updateRecapPrices] MISE À JOUR RÉCAPITULATIF PRIX");

    // Récupère l'option sélectionnée dans le select menu
    let selectedOption = null;
    if (menuSelect && menuSelect.options && menuSelect.selectedIndex >= 0) {selectedOption = menuSelect.options[menuSelect.selectedIndex];} 
    
    if (DebugConsole) console.log("[updateRecapPrices] selectedOption :", selectedOption);

    // Nom du menu
    let menuName = ' ';
    if (selectedOption && sanitizeHtml(selectedOption.text)) {menuName = sanitizeHtml(selectedOption.text);}
    
    if (DebugConsole) console.log("[updateRecapPrices] menuName :", menuName);

    // Prix unitaire stocké dans l'attribut data-price du <option>
    let unitPrice = 0;
    if (selectedOption && selectedOption.dataset && selectedOption.dataset.price) {
      unitPrice = parseFloat(selectedOption.dataset.price);
      if (isNaN(unitPrice)) {
        unitPrice = 0;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] unitPrice :", unitPrice);

    // Nombre minimum de personnes
    let minPersons = 1;
    if (selectedOption && selectedOption.dataset && selectedOption.dataset.minPersons) {
      minPersons = parseInt(selectedOption.dataset.minPersons);
      if (isNaN(minPersons)) {
        minPersons = 1;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] minPersons :", minPersons);

    // Nombre de personnes sélectionné
    let persons = 1;
    if (personsInput && personsInput.value) {
      persons = parseInt(personsInput.value);
      if (isNaN(persons) || persons < 1) {
        persons = 1;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] persons :", persons);

    // Sous-total = prix unitaire × nombre de personnes
    let subtotal = unitPrice * persons;
    if (DebugConsole) console.log("[updateRecapPrices] subtotal:", subtotal);

    // Réduction : -10% si > min + 5
    let reduction = 0;
    if (persons > (minPersons + 5)) {reduction = subtotal * 0.10;}
    if (DebugConsole) console.log("[updateRecapPrices] reduction:", reduction);

    // Total avant livraison
    let totalBeforeDelivery = subtotal - reduction;
    if (DebugConsole) console.log("[updateRecapPrices] totalBeforeDelivery:", totalBeforeDelivery);

    // Total TTC = (sous-total - réduction) + frais de livraison
    const total = totalBeforeDelivery + deliveryFee;
    if (DebugConsole) console.log("[updateRecapPrices] total:", total);

    // Calcul acompte
    let typeEvent = selectedOption?.dataset.theme || 'autre';

    // Calcul de l'acompte selon le thème
    let acompte = 0;
    // cas ciblé: Mariage, Anniversaire, Noël, Événement, Jour de l'an, Ascension
    if ((typeEvent.toLowerCase() === "mariage")||
        (typeEvent.toLowerCase() === "anniversaire")||
        (typeEvent.toLowerCase() === "noël")||
        (typeEvent.toLowerCase() === "événement")||
        (typeEvent.toLowerCase() === "jour de l'an")||
        (typeEvent.toLowerCase() === "ascension")){
      acompte = total * 0.5; // 50% cas ciblé
    } else {
      acompte = total * 0.3; // 30% pour les autres thèmes
    }

    // Récupère les éléments du DOM pour afficher le récapitulatif
    const recapMenuName = document.getElementById('recap-menu-name');
    const recapUnitPrice = document.getElementById('recap-unit-price');
    const recapPersons = document.getElementById('recap-persons');
    const recapSubtotal = document.getElementById('recap-subtotal');
    const recapReduction = document.getElementById('recap-reduction');
    const recapDelivery = document.getElementById('recap-delivery');
    const recapTotal = document.getElementById('recap-total');
    const recapAcompte = document.getElementById('recap-acompte');

    // Mise à jour de chaque ligne du récapitulatif
    if (recapMenuName) {recapMenuName.textContent = `${sanitizeHtml(menuName)}`;}
    if (DebugConsole) console.log("[updateRecapPrices] recapMenuName:", recapMenuName.textContent);

    if (recapUnitPrice) {
      if (unitPrice > 0) {
        recapUnitPrice.textContent =`${sanitizeHtml(unitPrice)} €/pers.`;
      } else {
        recapUnitPrice.textContent =`${'0'} €/pers.`;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapUnitPrice:", recapUnitPrice.textContent);

    if (recapPersons) {
      if (persons > 0) {
        recapPersons.textContent = `${sanitizeHtml(persons)}`;
      } else {
        recapPersons.textContent = `${' '}`;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapPersons:", recapPersons.textContent);

    if (recapSubtotal) {
      if (!isNaN(subtotal) && subtotal > 0) {
        recapSubtotal.textContent = `${subtotal.toFixed(2)} €`;
      } else {
        recapSubtotal.textContent = `${'0'} €`;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapSubtotal:", recapSubtotal.textContent);

    if (recapReduction) {
      if (reduction > 0) {
        recapReduction.textContent = `${reduction.toFixed(2)} €`;
      } else {
        recapReduction.textContent = `${'0'} €`;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapReduction:", recapReduction.textContent);


    if (recapDelivery) {
      if (deliveryFee && !isNaN(deliveryFee) && deliveryFee > 0) {
        recapDelivery.textContent = `${deliveryFee.toFixed(2)} €`;
      } else {
        recapDelivery.textContent = 'Gratuite';
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapDelivery:", recapDelivery.textContent);

    if (recapAcompte) {
      if (!isNaN(acompte) && acompte > 0) {
        recapAcompte.textContent = `${acompte.toFixed(2)} €`;
      } else {
        recapAcompte.textContent = `${'0'} €`;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] total:", total, "acompte:", acompte);


    if (recapTotal) {
      if (total !== undefined && total !== null && !isNaN(total) && total !== 0 && total > 0) {
        recapTotal.textContent = `${total.toFixed(2)} €`;
      } else {
        recapTotal.textContent = `${'0'} €`;
      }
    }
    if (DebugConsole) console.log("[updateRecapPrices] recapTotal:", recapTotal);

    return total;
  }

  /* ===============================
      FONCTION : AFFICHE LA PAGE DE CONFIRMATION (ÉTAPE 4)
        - 1. Récupère toutes les infos saisies dans les étapes précédentes
        - 2. Calcule le total final (menus + livraison)
        - 3. Remplit les champs de la page de confirmation
        - 4. Affiche l'étape 4
     =============================== */ 
  function showConfirmation(orderTitle,clientEmail) {
    if (DebugConsole) console.log("[showConfirmation] AFFICHE LA PAGE DE CONFIRMATION:");

    // Récupération des éléments DOM
    const emailElement = document.getElementById('confirm-email');
    const orderIdElement = document.getElementById('confirm-order-id');

    // Mettre à jour l'email dans la confirmation
    if (emailElement) {
      emailElement.textContent = sanitizeHtml(clientEmail || ' ')
      if (DebugConsole) console.log("[showConfirmation] Email :", emailElement.textContent);
    }

    // Mettre à jour le numéro de commande
    if (orderIdElement) {
      orderIdElement.textContent = sanitizeHtml(orderTitle);
      if (DebugConsole) console.log("[showConfirmation] orderTitle :", orderIdElement.textContent);
    }

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
      menuName = sanitizeHtml(selectedOption?.text || ' ');
    } else {
      menuName = ' ';
    }
    if (DebugConsole) console.log("[showConfirmation] menuName:", menuName);

    let persons;
    if (personsInput && personsInput.value) {
      persons = sanitizeInput(personsInput.value);
    } else {
      persons = ' ';
    }
    if (DebugConsole) console.log("[showConfirmation] persons:", persons);

    // Récupère la date et l'heure saisies à l'étape 2
    let date = '';
    let time = '';

    if (dateInput && dateInput.value) {
      date = sanitizeInput(dateInput.value);
    }
    if (DebugConsole) console.log("[showConfirmation] date:", date);

    if (timeInput && timeInput.value) {
      time = sanitizeInput(timeInput.value);
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

    // Récupère les éléments du DOM de la page confirmation
    const confirmMenu = document.getElementById('confirm-menu');
    const confirmPersons = document.getElementById('confirm-persons');
    const confirmDate = document.getElementById('confirm-date');
    const confirmTotal = document.getElementById('confirm-total');

    if (confirmMenu) confirmMenu.textContent = sanitizeInput(menuName);
    if (confirmPersons) confirmPersons.textContent = sanitizeInput(persons);
    if (confirmDate) confirmDate.textContent = `${sanitizeInput(date)} à ${sanitizeInput(time)}`;
    if (confirmTotal) confirmTotal.textContent = `${updateRecapPrices()}€`;

    if (DebugConsole) {
      console.log("=== showConfirmation ===");
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
      FONCTION : LISTENERS INPUT PERSON
     =============================== */
  function handlePersonsInput() {
    const selectedOption = menuSelect.options[menuSelect.selectedIndex];
    const minPersons = parseInt(selectedOption.dataset.minPersons) || 10;
    const maxPersons = parseInt(selectedOption.dataset.maxPersons) || 1000;

    if (personsInput.value < minPersons) {
      personsInput.value = sanitizeInput(minPersons);
      showToast(`Minimum ${minPersons} personnes pour ce menu`,'error');
    }

    if (personsInput.value > maxPersons) {
      personsInput.value = sanitizeInput(maxPersons);
      showToast(`Maximum ${maxPersons} personnes pour ce menu`,'error');
    }

    updateRecapPrices();
  }

  /* ===============================
    FONCTION : RECUPERATION DE L'ADRESSE DE LIVRAISON
    =============================== */
  function getDeliveryAddress() {
      if (sameAddressCheckbox && sameAddressCheckbox.checked) {
        return {
          adresse: sanitizeInput(addressInput?.value || ''),
          ville: sanitizeInput(cityInput?.value || ''),
          code_postal: sanitizeInput(postalInput?.value || '')
        };
      }
      return {
        adresse: sanitizeInput(deliveryAddressInput?.value || ''),
        ville: sanitizeInput(deliveryCityInput?.value || ''),
        code_postal: sanitizeInput(deliveryPostalInput?.value || '')
      };
  }




  
  /* ===============================
      LISTENERS : INPUT FORM
     =============================== */
  // Inputs à surveiller
  const profileInputs = [
    firstNameInput,
    lastNameInput,
    phoneInput,
    addressInput,
    cityInput,
    postalInput
  ];

  // Dès qu'un input change, on marque que le profil a été modifié
  profileInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        isModified = true;
        if (DebugConsole) console.log(`[PROFILE INPUT] ${input.id} modifié, isModified = true`);
      });
    }
  });

  // Gestion de la checkbox "Même adresse"
  if (sameAddressCheckbox) {
    sameAddressCheckbox.addEventListener('change', function() {
      if (sameAddressCheckbox.checked) {
        deliveryFieldsContainer.classList.add('d-none');
      } else {
        deliveryFieldsContainer.classList.remove('d-none');
      }
    });
  }


  /* ===============================
      LISTENERS : MENU & PERSONNES
        - 1. Mise à jour du récap en temps réel
        - 2. Dès que le client change le menu ou le nombre de personnes,
          le récapitulatif se recalcule automatiquement
     =============================== */

  if (menuSelect) {
    menuSelect.addEventListener('change', function() {
      const selectedOption = menuSelect.options[menuSelect.selectedIndex];
      prefillPersonsMin(selectedOption);
      updateRecapPrices();
    });
    if (DebugConsole) console.log("[LISTENERS] menuSelect:", menuSelect);
  }
  
  /* ===============================
      LISTENERS : BOUTONS SUIVANT
        - Étape 1 -> 2 : vérifie que les infos personnelles sont remplies
     =============================== */

  // Bouton "Étape suivante" de l'étape 1 (Informations -> Livraison)
  const btnNext1 = document.getElementById('btn-next-1');
  if (btnNext1) {
    btnNext1.addEventListener('click', async () => {
      if (DebugConsole){
        console.log("[toast] déclenché");
      } 
      
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

  /* ===============================
      LISTENERS : BOUTONS SUIVANT
        - Étape 2 -> 3 : vérifie l'adresse, PUIS calcule les frais de livraison
          via l'API avant d'afficher le récap
     =============================== */
  // Bouton "Étape suivante" de l'étape 2 (Livraison -> Menu & Récap)
  // CE LISTENER est async car on attend le retour de l'API
  // avant d'afficher l'étape 3 avec les frais de livraison calculés
  const btnNext2 = document.getElementById('btn-next-2');
  if (btnNext2) {
    btnNext2.addEventListener('click', async () => {

      // Vérifie que tous les champs required de l'étape 2 sont remplis
      if (isStepValid(2)) {
        
        // Vérifie si l'un des champs des inputs à changées
        await updateUserIfChanged();

        // Vérifie que les champs livraison sont remplis
        const delivery = getDeliveryAddress();
        if (!delivery.adresse || !delivery.ville || !delivery.code_postal) {
            showToast('Veuillez remplir tous les champs d\'adresse de livraison', 'error');
            return;
        }

        // Appelle l'API /delivery-cost pour calculer les frais
        // 2. Une fois les frais calculés, affiche l'étape 3
        await calculateDeliveryFee();
        // Pré-remplissage avec la valeur min personnes d'un menu ciblé
        const selectedOption = menuSelect.options[menuSelect.selectedIndex];
        prefillPersonsMin(selectedOption);

        showStep(3);

        // Sélection automatique du menu depuis l'URL
        autoSelectMenuFromUrl(); 
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
      FONCTION : RESET STATE BOUTON
     =============================== */
  function resetSubmitButton() {
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('disabled');
    btnSubmit.innerHTML = 'Confirmer la commande';
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

      // Vérifie que toutes les étapes sont valides
      const step1Valid = isStepValid(1);
      const step2Valid = isStepValid(2);
      const step3Valid = isStepValid(3);

      if (!step1Valid || !step2Valid || !step3Valid) {
        showToast('Veuillez remplir tous les champs obligatoires','success');
        return;
      }

      if (!isHoraireValide(dateInput.value, timeInput.value)) return;
      
      // Vérification de la date 
      const selectedDate = new Date(dateInput.value + 'T00:00'); // force 00:00 local
      const today = new Date();
      // ignore heures/minutes
      today.setHours(0,0,0,0); 

      // REGLE METIER: minimum 3 jours avant la commande pour theme !marriage || !événement
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + nb_jourDate);
      if (selectedDate < minDate) {
        showToast('La date de prestation doit être supérieure à 3 jours','success');
        return;// empêche la soumission
      }

      // REGLE METIER : si +20 personnes, minimum 14 jours
      const persons = parseInt(personsInput.value) || 1;
      if (persons > 20) {
        const minDate20 = new Date(today);
        minDate20.setDate(minDate20.getDate() + 14);
        if (selectedDate < minDate20) {
          showToast('Pour plus de 20 personnes, la date doit être supérieure à 14 jours','success');
          return; // empêche la soumission
        }
      }

      // Met à jour le profil si modifié
      await updateUserIfChanged();

      // Calcule les frais de livraison avant soumission
      await calculateDeliveryFee();

      // REGLE METIER : Vérification distance max 200 km
      if (deliveryDistanceKm > 200) {
        showToast('Livraison impossible : distance supérieure à 200 km','success');
        return;
      }

      // récupère le total TTC
      const prixTotal = updateRecapPrices(); 

      // Collecte toutes les données saisies dans les 3 étapes
      const delivery = getDeliveryAddress();
      const formData = {
          menu_id: parseInt(menuSelect.value) || 0,
          date_prestation: dateInput.value,
          nombre_personnes: persons,
          adresse_livraison: delivery.adresse,
          heure_livraison: timeInput.value,
          ville_livraison: delivery.ville,
          code_postal_livraison: delivery.code_postal,
          distance_km: deliveryDistanceKm,
          pret_materiel: materialCheckbox.checked,
      };

      // Désactive le bouton pour éviter le multi click
      btnSubmit.disabled = true;
      btnSubmit.classList.add('disabled');

      // Change le texte du bouton 
      btnSubmit.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        Envoi en cours...
      `;

      if (DebugConsole) console.log("Commande confirmée:", formData);
      try {
        const response = await fetch(apiCommander, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(formData)
        });

        if (DebugConsole) console.log("[submitCommande] Réponse de l'API");

        if (response.ok) {
          // La commande a été créée avec succès

          // récupère le back
          let createdOrder = {};
          try {
            createdOrder = await response.json();
          } catch {
            createdOrder = { message: "Erreur serveur" };
          }

          const orderTitle = createdOrder.numero_commande ||  ' ';
          const clientEmail = createdOrder.email || createdOrder.utilisateur?.email || ' ';

          setTimeout(() => {
            showConfirmation(orderTitle,clientEmail);
          }, 1000);

          btnSubmit.innerHTML = 'Commande validée';
          
          if (DebugConsole) console.log("[submitCommande] Commande créée :", createdOrder);
        } else {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: "Erreur serveur" };
          }
          console.error("[submitCommande] ERREUR 400 :", JSON.stringify(errorData));
          resetSubmitButton();
          showToast(errorData.message || "Erreur lors de la création de la commande", 'error');
          return;
        }
      } catch (err) {
        // Erreur réseau
        console.error('Erreur réseau :', err);
        resetSubmitButton();
      }
    });
  }

  /* ===============================
      INITIALISATION : AFFICHER L'ÉTAPE 1
        - Au chargement de la page, on affiche toujours l'étape 1
     =============================== */

  showStep(1);
}