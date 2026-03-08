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
  const personsInput = document.getElementById('CommandPersons');

  // Étape actuelle (1, 2, 3 ou 4)
  let currentStep = 1;

  // Variable pour stocker les frais de livraison calculés par l'API
  // Par défaut à 0 (= livraison gratuite)
  let deliveryFee = 0;

  /* ===============================
     FONCTION : AFFICHER UNE ÉTAPE
     - Cache tous les panels
     - Affiche uniquement le panel demandé
     - Met à jour les pastilles du stepper (active / completed)
     - Cache le stepper à l'étape 4 (page de confirmation)
     =============================== */

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
    });

    // Met à jour la variable qui mémorise l'étape en cours
    currentStep = stepNumber;
  }

  /* ===============================
     FONCTION : VÉRIFIER QUE LES CHAMPS SONT REMPLIS
     - Récupère le formulaire de l'étape donnée..
     - Vérifie que tous les champs "required" ont une valeur non vide.
     - Retourne true si tout est valide, false sinon.
     =============================== */

  function isStepValid(stepNumber) {

    // Récupère le formulaire de l'étape
    const form = document.getElementById(`form-step-${stepNumber}`);

    // Si pas de formulaire pour cette étape ex étape 3, on considère valide
    if (!form) return true;

    // Sélectionne tous les champs avec l'attribut required
    const inputs = form.querySelectorAll('input[required], select[required]');
    let valid = true;

    // Vérifie que chaque champ a une valeur non vide
    inputs.forEach(input => {
      if (!input.value || !input.value.trim()) valid = false;
    });

    return valid;
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

    // Récupère les valeurs saisies par le client à l'étape 2
    const address = document.getElementById('CommandAddress')?.value || '';
    const city = document.getElementById('CommandCity')?.value || '';
    const postal = document.getElementById('CommandPostal')?.value || '';

    // Construit l'adresse complète au format attendu par Nominatim
    // Exemple : "12 rue des Roses, 33000 Bordeaux, France"
    const fullAddress = `${address}, ${postal} ${city}, France`;

    try {
      // Appel GET vers notre endpoint Symfony /delivery-cost
      // Le back va :
      //   1. Géocoder cette adresse via Nominatim (lat/lon)
      //   2. Calculer la distance routière via OSRM
      //   3. Appliquer la règle tarifaire
      //   4. Retourner le JSON avec frais_livraison
      const response = await fetch(
        `http://127.0.0.1:8000/delivery-cost?adresse=${encodeURIComponent(fullAddress)}`
      );

      // Si la réponse n'est pas OK (400, 404, 500...), on met les frais à 0
      if (!response.ok) {
        console.error('Erreur API livraison:', response.status);
        deliveryFee = 0;
        return;
      }

      // Parse la réponse JSON de l'API
      const data = await response.json();

      // Stocke les frais de livraison retournés par l'API
      // data.frais_livraison contient soit 0 (gratuit) soit le montant calculé
      deliveryFee = data.frais_livraison || 0;

      // Logs pour le debug en console
      console.log(' Distance:', data.distance_km, 'km (' + data.distance_type + ')');
      console.log(' Frais livraison:', deliveryFee, '€');

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
    // Récupère l'option sélectionnée dans le select menu
    const selectedOption = menuSelect?.options[menuSelect.selectedIndex];

    // Nom du menu (ex: "Festin de Noël Traditionnel")
    const menuName = selectedOption?.text || '—';

    // Prix unitaire stocké dans l'attribut data-price du <option>
    const unitPrice = parseFloat(selectedOption?.dataset.price) || 0;

    // Nombre de personnes saisi par le client
    const persons = parseInt(personsInput?.value) || 0;

    // Sous-total = prix unitaire × nombre de personnes
    const subtotal = unitPrice * persons;

    // Total TTC = sous-total des menus + frais de livraison
    const total = subtotal + deliveryFee;

    // Récupère les éléments du DOM pour afficher le récapitulatif
    const recapMenuName = document.getElementById('recap-menu-name');
    const recapUnitPrice = document.getElementById('recap-unit-price');
    const recapPersons = document.getElementById('recap-persons');
    const recapSubtotal = document.getElementById('recap-subtotal');
    const recapDelivery = document.getElementById('recap-delivery');
    const recapTotal = document.getElementById('recap-total');

    // Mise à jour de chaque ligne du récapitulatif
    if (recapMenuName) recapMenuName.textContent = menuName;
    if (recapUnitPrice) recapUnitPrice.textContent = unitPrice ? `${unitPrice}€/pers.` : '—';
    if (recapPersons) recapPersons.textContent = persons || '—';
    if (recapSubtotal) recapSubtotal.textContent = subtotal ? `${subtotal.toFixed(2)}€` : '—';

    // Affiche "Gratuite" si 0€, sinon affiche le montant des frais
    if (recapDelivery) {
      recapDelivery.textContent = deliveryFee > 0 ? `${deliveryFee.toFixed(2)}€` : 'Gratuite';
    }

    // Total TTC = sous-total + livraison
    if (recapTotal) recapTotal.textContent = total ? `${total.toFixed(2)}€` : '—';
  }

  /* ===============================
    FONCTION : GÉNÉRER UN NUMÉRO DE COMMANDE
    - Crée un identifiant unique au format CMD-ANNÉE-XXXX
    - XXXX = nombre aléatoire à 4 chiffres
    - Utilisé uniquement pour l'affichage côté front
    - En production, l'ID viendra de l'API back
    =============================== */

  function generateOrderId() {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
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

    // Récupère les infos du menu sélectionné
    const selectedOption = menuSelect?.options[menuSelect.selectedIndex];
    const menuName = selectedOption?.text || '—';
    const persons = personsInput?.value || '—';

    // Récupère la date et l'heure saisies à l'étape 2
    const date = document.getElementById('CommandDate')?.value || '';
    const time = document.getElementById('CommandTime')?.value || '';

    // Récupère l'email saisi à l'étape 1
    const email = document.getElementById('CommandEmail')?.value || '';

    // Calcule le total final : (prix unitaire × personnes) + frais de livraison
    const unitPrice = parseFloat(selectedOption?.dataset.price) || 0;
    const total = (unitPrice * parseInt(persons) + deliveryFee).toFixed(2);

    // Récupère les éléments du DOM de la page confirmation
    const confirmOrderId = document.getElementById('confirm-order-id');
    const confirmEmail = document.getElementById('confirm-email');
    const confirmMenu = document.getElementById('confirm-menu');
    const confirmPersons = document.getElementById('confirm-persons');
    const confirmDate = document.getElementById('confirm-date');
    const confirmTotal = document.getElementById('confirm-total');

    // Remplit chaque champ de la confirmation
    if (confirmOrderId) confirmOrderId.textContent = generateOrderId();
    if (confirmEmail) confirmEmail.textContent = email;
    if (confirmMenu) confirmMenu.textContent = menuName;
    if (confirmPersons) confirmPersons.textContent = persons;
    if (confirmDate) confirmDate.textContent = `${date} à ${time}`;
    if (confirmTotal) confirmTotal.textContent = `${total}€`;

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

  if (personsInput) {
    personsInput.addEventListener('input', updateRecapPrices);
  }

  /* ===============================
     LISTENERS : BOUTONS SUIVANT
     - Étape 1 -> 2 : vérifie que les infos personnelles sont remplies
     - Étape 2 -> 3 : vérifie l'adresse, PUIS calcule les frais de livraison
       via l'API avant d'afficher le récap
     =============================== */

  // Bouton "Étape suivante" de l'étape 1 (Informations -> Livraison)
  btnNext1 = document.getElementById('btn-next-1');
  if (btnNext1) {
    btnNext1.addEventListener('click', () => {

      // Vérifie que tous les champs required de l'étape 1 sont remplis
      if (isStepValid(1)) {
        showStep(2);
      }
    });
  }
 
  // Bouton "Étape suivante" de l'étape 2 (Livraison -> Menu & Récap)
  // CE LISTENER est async car on attend le retour de l'API
  // avant d'afficher l'étape 3 avec les frais de livraison calculés
  btnNext2 = document.getElementById('btn-next-2');
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
  }

  /* ===============================
     LISTENERS : BOUTONS RETOUR
     - Permettent de revenir à l'étape précédente
     =============================== */

  // Bouton "Retour" de l'étape 2 → retour à l'étape 1
  btnPrev2 = document.getElementById('btn-prev-2');
  if (btnPrev2) {
    btnPrev2.addEventListener('click', () => {
      showStep(1);
    });
  }

  // Bouton "Retour" de l'étape 3 → retour à l'étape 2
  btnPrev3 = document.getElementById('btn-prev-3');
  if (btnPrev3) {
    btnPrev3.addEventListener('click', () => {
      showStep(2);
    });
  }

  /* ===============================
     LISTENER : BOUTON CONFIRMER LA COMMANDE
     - 1. Collecte toutes les données du formulaire multi-étapes
     - 2. En production : envoie les données à l'API POST /api/orders
     - 3. Pour l'instant : log en console + affiche la confirmation
     =============================== */

  btnSubmit = document.getElementById('btn-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      // Collecte toutes les données saisies dans les 3 étapes
      const formData = {
        firstName: document.getElementById('CommandFirstName')?.value,
        lastName: document.getElementById('CommandLastName')?.value,
        phone: document.getElementById('CommandPhone')?.value,
        email: document.getElementById('CommandEmail')?.value,
        address: document.getElementById('CommandAddress')?.value,
        city: document.getElementById('CommandCity')?.value,
        postalCode: document.getElementById('CommandPostal')?.value,
        date: document.getElementById('CommandDate')?.value,
        time: document.getElementById('CommandTime')?.value,
        menu: menuSelect?.value,
        persons: personsInput?.value,
        material: document.getElementById('CommandMaterial')?.checked,
        // On ajoute aussi les frais de livraison calculés
        deliveryFee: deliveryFee
      };

      console.log(' Commande confirmée:', formData);

      // Appel de l'API (commenté en attendant que l'endpoint soit prêt) :
      // try {
      //   const response = await fetch('/api/orders', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': `Bearer ${localStorage.getItem('token')}`
      //     },
      //     body: JSON.stringify(formData)
      //   });
      //   const data = await response.json();
      //
      //   if (response.ok) {
      //     showConfirmation();
      //   } else {
      //     console.error('Erreur commande:', data.message);
      //   }
      // } catch (err) {
      //   console.error('Erreur réseau:', err);
      // }

      // En attendant l'API, on affiche directement la confirmation

      showConfirmation();
    });
  }

  /* ===============================
     INITIALISATION : AFFICHER L'ÉTAPE 1
     - Au chargement de la page, on affiche toujours l'étape 1
     =============================== */

  showStep(1);
}