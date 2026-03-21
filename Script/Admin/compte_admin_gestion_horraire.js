import { API_URL } from '../config.js';
import { getToken } from '../script.js';

export function initCompteAdminGestionHorrairePage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION HORRAIRE
     =============================== */
  
  // Variable debug console : passer à false pour désactiver tous les logs
  let DebugConsole = false;

  // Variable de stockage des données récuperer de api/me
  let originalHoraires = {};

  /* ===============================
     CONFIGURATION API
     =============================== */

  // URL de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // URL de récupération des infos de l'utilisateur
  const apiGetHoraire = `${API_URL}/api/horaires`;

  // URL de mise à jour des données
  const apiUpdateHoraire = `${API_URL}/api/admin/horaires/`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL :", API_URL);
    console.log("apiMeUrl :", apiMeUrl);
    console.log("apiGetHoraire :", apiGetHoraire);
    console.log("apiUpdateHoraire :", apiUpdateHoraire);
    console.log("========================");
  }

  /* ===============================
     RECUPERATION DES INFOS UTILISATEURS
     =============================== */

  // Récupère le token JWT depuis le cookie
  const token = getToken();

  if (!token) {
    console.error('Pas de token, impossible de charger les données');
    return;
  }

  // Headers réutilisables pour toutes les requêtes authentifiées
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (DebugConsole) {
    console.log("=== DEBUG INIT COMPTE ADMIN ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel :", token);
    console.log("================================");
  }
  /* ===============================
     RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // Bouton de sauvegarde des données Horraires
  const submitBtn = document.getElementById('sauvegarde_horraire');

  // Récupère le toast et initialise l'objet Bootstrap
  const toastEl = document.getElementById('toast-message');
  /*
    Sélection des éléments Dom concerannt les horaires
  */
  const GetValueHorraire = {
    lundi: { open: document.getElementById('open-lundi'), close: document.getElementById('close-lundi') },
    mardi: { open: document.getElementById('open-mardi'), close: document.getElementById('close-mardi') },
    mercredi: { open: document.getElementById('open-mercredi'), close: document.getElementById('close-mercredi') },
    jeudi: { open: document.getElementById('open-jeudi'), close: document.getElementById('close-jeudi') },
    vendredi: { open: document.getElementById('open-vendredi'), close: document.getElementById('close-vendredi') },
    samedi: { open: document.getElementById('open-samedi'), close: document.getElementById('close-samedi') },
    dimanche: { open: document.getElementById('open-dimanche'), close: document.getElementById('close-dimanche') }
  };

  /* ===============================
  FONCTION : AFFICHAGE DU PRÉNOM DANS LE HERO
    - 1.  Appelle GET /api/me
    - 2.  Décode le token JWT pour récupérer le prenom, nom, email, role
    - 3.  Remplit le span #hero-user-name avec le prenom récuperer du token
    =============================== */

  async function loadUserName() {
    if (DebugConsole) console.log("[loadUserName] Début - Appel GET", apiMeUrl);

    try {
      const response = await fetch(apiMeUrl, {
        method: 'GET',
        headers: authHeaders
      });

      if (DebugConsole) console.log("[loadUserName] Réponse status :", response.status);

      if (!response.ok) {
        if (DebugConsole) console.log("[loadUserName] Réponse non OK, abandon");
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (DebugConsole) console.log("[loadUserName] Données reçues :", data);

      if (heroUserName && data.utilisateur) {
        heroUserName.textContent = data.utilisateur.prenom || data.utilisateur.email || '';
        if (DebugConsole) console.log("[loadUserName] Prénom affiché dans le hero :",  data.utilisateur.prenom);
      } else {
        if (DebugConsole) console.log("[loadUserName] Element #hero-user-name non trouvé ou pas de donnée utilisateurs disponible");
      }

    } catch (err) {
      console.error('[loadUserName] Erreur :', err);
    }
  }
  loadUserName();

  /* ===============================
    FONCTION : TOAST BOOTSTRAP POUR ENVOYER LES MESSAGES A l'ADMIN
    =============================== */
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 }); // delay = 3 secondes

  function showToast(message) {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = message || "Action effectuée !";

    toastBootstrap.show();
  }

  /* ===============================
    FONCTION : TOAST BOOTSTRAP changement de classe en cas d'érreur
    Utilisation : 
      Erreur -> showToast("Aucune modification détectée.", "error"); 
      Pas d'érreur  ->showToast("Horaires mis à jour !");
    =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = message || "Action effectuée !";

    // Retire les classes précédentes et applique la bonne
    toastEl.classList.remove('toast-success', 'toast-error');
    toastEl.classList.add(type === 'error' ? 'toast-error' : 'toast-success');
    toastBootstrap.show();
  }

 /* ===============================
    FONCTION : VERIFICATION DE LA VALEUR HORRAIRE
     - 1. Vérifie si la valeur rentrer dans l'input de texte est valide
     - 2. Gestion du cas Fermé ou 00:00 ou vide = Fermé point de vue UX
    =============================== */
  function ValidationHoraire(timeValue) {
    if (!timeValue || timeValue === "00:00" || timeValue === "Fermé") {
        return "Fermé";
    }

    // Vérifie que c'est bien au format HH:MM
    const regexTime = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regexTime.test(timeValue)) {
        return "Fermé";
    }
    return timeValue;
  }  

 /* ===============================
    FONCTION : RECUPERATION DES DONNEES HORRAIRES DU SITE
     - récupère les données de l'input et stock les variable dans originalHoraires
    =============================== */

  async function GetHoraire() {
    if (DebugConsole) console.log("[GetHorraire] Début - Appel GET", apiGetHoraire);

      // Appel de l'API pour récupérer les horaires
      try {
        const response = await fetch(apiGetHoraire, {
          method: 'GET',
          headers: authHeaders
        });

        if (DebugConsole) console.log("[GetHorraire] Réponse status :", response.status);

        if (!response.ok) {
          if (DebugConsole) console.log("Impossible de récupérer les horaires status :",`${response.status}`);
          return;
        }

        let horaires = null;
        // évite que le script crash si la réponse n'est pas du JSON
        try {
          horaires = await response.json();
        } catch {
          horaires = {};
        }
        if (DebugConsole) console.log("[GetHorraire] Données reçues :", horaires);

        // Remplissage des inputs pour chaque jour d'après les valeur de la DDB
        horaires.forEach(horaire => {
          const jourKey = horaire.jour.toLowerCase().trim();
          if (DebugConsole) console.log("Mapping API :", `"${horaire.jour}"`, "=>", `"${jourKey}"`);
          if (GetValueHorraire[jourKey]) {

            // Vérifie les données
            const openVal = ValidationHoraire(horaire.heureOuverture);
            const closeVal = ValidationHoraire(horaire.heureFermeture);

            // Injecte les valeurs
            GetValueHorraire[jourKey].open.value = openVal;
            GetValueHorraire[jourKey].close.value = closeVal;

            // Stocke les horaires originaux
            originalHoraires[jourKey] = {
              id: horaire.horaire_id,
              heure_ouverture: openVal,
              heure_fermeture: closeVal
            };
            if (DebugConsole) console.log(`${horaire.jour} : ${horaire.heureOuverture} : ${horaire.heureFermeture}`);
          }
        });
      } catch (err) {
        console.error('Erreur récupération horaires :', err);
    }
    if (DebugConsole) console.log("originalHoraires =", originalHoraires);
  }

  // Lancement de la fonction de Récupération APi
  GetHoraire();

  /* ===============================
     FONCTION : FILTRE DES DONNEE QUI ONT ETAIT MODIFIER
      Compare les données actuel au tableau originalHoraires 
      pour éviter trop d'appel APi 
     =============================== */
  function getChangedHoraires() {
    const horairesToSend = [];
    const jours = Object.keys(GetValueHorraire);

    for (let i = 0; i < jours.length; i++) {
      const id = i;
      const jour = jours[i];
      const elements = GetValueHorraire[jour];

      const heureOuverture = elements.open.value || "Fermé";
      const heureFermeture = elements.close.value || "Fermé";

      // Comparer avec les horaires originaux
      const original = originalHoraires[jour];
      
      if (!original || !original.id) {
        console.error(`ID manquant pour ${jour}`);
        continue;
      }


      if (heureOuverture !== original.heure_ouverture || heureFermeture !== original.heure_fermeture) {
        // Ajoute uniquement si modifié
        horairesToSend.push({
          horaire_id: original.id,
          jour: jour.charAt(0).toUpperCase() + jour.slice(1),
          heure_ouverture: heureOuverture,
          heure_fermeture: heureFermeture
        });
        if (DebugConsole) console.log("ID reçu :", original.id);
      }
    }
    if (DebugConsole) console.log("Horaires modifiés :", horairesToSend);
    return horairesToSend;
  }

  /* ===============================
     FONCTION : MET A JOUR LES HORRAIRES 
      1- Appel PUT /api/admin/horaires/{id}  
     =============================== */
  async function updateHoraires(horairesToSend) {
    for (const horaire of horairesToSend) {
      const url = `${apiUpdateHoraire}${horaire.horaire_id}`;

      // Prépare le body pour l'API
      const data = {
        heure_ouverture: horaire.heure_ouverture === "Fermé" ? "00:00" : horaire.heure_ouverture,
        heure_fermeture: horaire.heure_fermeture === "Fermé" ? "00:00" : horaire.heure_fermeture
      };

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          console.error(`Erreur lors de la mise à jour de ${horaire.jour} :`, response.status);
        } else if (DebugConsole) {
          console.log(`${horaire.jour} mis à jour avec succès`, data);
        }

      } catch (err) {
        console.error(`Erreur fetch pour ${horaire.jour} :`, err);
      }
    }
    if (DebugConsole) console.log("Toutes les mises à jour sont terminées !");
  }

  /* ===============================
     SUBMIT : SOUMISSION DES DONNEE QUI ONT ETAIT MODIFIER
     =============================== */
  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const horairesModifies = getChangedHoraires();

    if (horairesModifies.length === 0) {
      showToast("Aucune modification détectée.", "error");
      return;
    }

    await updateHoraires(horairesModifies, true);

    showToast("Horaires mis à jour !");
  });

}