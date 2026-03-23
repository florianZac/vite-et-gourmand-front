import { API_URL } from '../config.js';
import { getToken} from '../script.js';

export function initCompteAdminGestionplatPage() {

  /* ===============================
      SCRIPT PAGE ADMIN GESTION MENUS
     =============================== */
  
  // Variable debug console
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API de récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API de récupération des plats
  const apiGetPlats = `${API_URL}/api/plats`;

  // EndPoint de l'API qui appel l'api cloudinary pour l'upload des photos
  const apiUploadImage = `${API_URL}/api/employe/upload/image`;

  // EndPoint de l'API pour la gestion crud des plats
  const apiEmployePlats = `${API_URL}/api/employe/plats`;

  // EndPoint de l'API pour l'association des plats a ces allergènes
  const apiGetAllergenes = `${API_URL}/api/allergenes`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL          :", API_URL);
    console.log("apiMeUrl         :", apiMeUrl);
    console.log("apiGetPlats      :", apiGetPlats);
    console.log("apiEmployePlats  :", apiEmployePlats);
    console.log("apiGetAllergenes :", apiGetAllergenes);
    console.log("apiUploadImage   :", apiUploadImage);
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
    console.log("=== DEBUG INIT COMPTE GESTION MENU ADMIN ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel    :", token);
    console.log("================================");
  }

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */
  // span qui contiendra le prénom de l'administrateur
  const heroUserName = document.getElementById('hero-user-name'); 

  // Liste qui contient tous les plats affichés
  const platsList = document.getElementById('plats-list');
  // Champ de recherche des plats
  const searchInput = document.getElementById('search-plat');
  // Bouton pour créer un nouveau plat
  const btnNewPlat = document.getElementById('btn-new-plat');
  // Card du plat
  const platFormCard = document.getElementById('plat-form-card');
  // Titre du formulaire
  const platFormTitle = document.getElementById('plat-form-title');
  // Select filtre les catégories de plat (Entrée/Plat/Dessert)
  const filterCategorie = document.getElementById('filter-categorie');
  // Bouton pour sauvegarder le plat
  const btnSavePlat = document.getElementById('btn-save-plat');
  // Bouton pour annuler
  const btnCancelPlat = document.getElementById('btn-cancel-plat');
  // Champ texte pour le titre du plat
  const inputTitre = document.getElementById('plat-titre');
  // Select pour la catégorie
  const selectCategorie = document.getElementById('plat-categorie');
  // Champ texte pour la description
  const inputDescription = document.getElementById('plat-description');
  // Input file pour choisir une image
  const inputPhotoFile = document.getElementById('plat-photo-file');
  // Input hidden qui stocke l'URL Cloudinary retournée par le back
  const inputPhotoUrl = document.getElementById('plat-photo-url');
  // Image pour afficher un aperçu de la photo
  const photoPreview = document.getElementById('plat-photo-preview');
  // Progress bar upload
  const uploadProgress = document.getElementById('upload-progress');
  const uploadBar = document.getElementById('upload-bar');
  const uploadStatus = document.getElementById('upload-status');
  // Conteneur des cases à cocher des allergènes
  const allergenesContainer = document.getElementById('plat-allergenes-checkboxes');
  // Élément HTML de la modale
  const deleteModalEl = document.getElementById('deletePlatModal');
  // Création de l'objet modal Bootstrap pour pouvoir l'ouvrir/fermer en JS
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  // Élément pour afficher le nom du plat à supprimer
  const deletePlatName = document.getElementById('delete-plat-name');
  // Bouton pour confirmer la suppression
  const confirmDeleteBtn = document.getElementById('confirm-delete-plat');
  // Élément HTML du toast
  const toastEl = document.getElementById('toast-message');
  // Création du toast avec un délai de 3 secondes
  const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 });

  // Variables
  let allPlats = [];
  let allAllergenes = [];
  let currentEditId = null;
  let currentDeleteId = null;

  /* ===============================
      TOAST
     =============================== */
  function showToast(message, type = 'success') {
    const body = toastEl.querySelector('.toast-body');
    body.textContent = message || "Action effectuée !";
    toastEl.classList.remove('toast-success', 'toast-error');
    toastEl.classList.add(type === 'error' ? 'toast-error' : 'toast-success');
    toastBootstrap.show();
  }

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
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (DebugConsole) console.log("[loadUserName] Données reçues :", data);

      if (heroUserName && data.utilisateur) {
        const prenom = data.utilisateur.prenom || data.utilisateur.email || '';
        heroUserName.textContent = prenom;
        if (DebugConsole) console.log("[loadUserName] Prénom affiché dans le hero :", prenom);
      } else {
        if (DebugConsole) console.log("[loadUserName] Element #hero-user-name non trouvé ou pas de donnée utilisateurs disponible");
      }

    } catch (err) {
      console.error('[loadUserName] Erreur :', err);
    }
  }
  loadUserName();

  /* ===============================
      FONCTION : UPLOAD IMAGE VIA LE BACK SYMFONY VIA CLOUDINARY
     =============================== */
  async function uploadImage(file) {
    if (DebugConsole) console.log("[uploadImage] Début - Appel", apiUploadImage);
    // Validation taille
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux (max 5 Mo)');
    }

    // Validation type
    const typesValides = ['image/jpeg', 'image/png', 'image/webp'];
    if (!typesValides.includes(file.type)) {
      throw new Error('Format invalide (JPG, PNG, WebP)');
    }

    // Envoi en multipart/form-data
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(apiUploadImage, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    let data = {};
    try { data = await response.json(); } catch { data = {}; }

    if (DebugConsole) console.log("[uploadImage]", data);

    if (!response.ok) {
      throw new Error(data.message || 'Erreur upload');
    }
    if (DebugConsole) console.log("[uploadImage] url", data.url);
    return data.url;
  }

  /* ===============================
      FONCTION : CHARGEMENT DES ALLERGÈNES POUR LE CHOIX AVEC CHECKBOXES
     =============================== */
  async function loadAllergenes() {
    if (DebugConsole) console.log("[loadAllergenes] Appel GET", apiGetAllergenes);
    try {
      const response = await fetch(apiGetAllergenes, { 
        method: 'GET', headers:authHeaders
        }
      );
      if (!response.ok){
        console.error('[loadAllergenes] Erreur API :', err);
        return;
      }
      let data = {};
      try { 
        data = await response.json();
      } catch {
        data = {}; 
      }
      allAllergenes = data.allergenes || [];

      if (DebugConsole) console.log("[loadAllergenes] Allergènes chargés :", allAllergenes.length);
    } catch (err) {
      console.error('[loadAllergenes] Erreur :', err);
    }
  }

  /* ===============================
      LISTENER SÉLECTION FICHIER APERCU ET UPLOAD
     =============================== */
  if (inputPhotoFile) {
    inputPhotoFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (DebugConsole) console.log("[inputPhotoFile] :", file);
      // Aperçu immédiat local avant l'upload
      const reader = new FileReader();
      if (DebugConsole) console.log("[inputPhotoFile] reader:", reader);
      reader.onload = (ev) => {
        photoPreview.src = ev.target.result;
        photoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);

      if (DebugConsole) console.log("[inputPhotoFile] lecture du fichier lancée");
      // Affiche la progress bar
      if (uploadProgress) uploadProgress.classList.remove('d-none');
      if (uploadBar) uploadBar.style.width = '0%';
      if (uploadStatus) uploadStatus.textContent = 'Upload en cours...';

      // Upload via le back Symfony vers le service Cloudinary
      try {
        showToast("Upload en cours...");
        const url = await uploadImage(file);

        // Stocke l'URL retournée dans l'input
        inputPhotoUrl.value = url;
        // Met à jour l'aperçu avec l'URL finale Cloudinary a envoyée
        photoPreview.src = url;

        if (uploadBar) uploadBar.style.width = '100%';
        if (uploadStatus) uploadStatus.textContent = 'Upload terminé !';

        showToast("Photo uploadée !");
        if (DebugConsole) console.log("[uploadImage] URL :", url);

        // Cache la progress bar après 3s
        setTimeout(() => {
          if (uploadProgress) uploadProgress.classList.add('d-none');
        }, 3000);

      } catch (err) {
        console.error('[uploadImage] Erreur :', err);
        showToast(err.message || "Erreur upload.", "error");
        inputPhotoFile.value = '';
        inputPhotoUrl.value = '';
        photoPreview.style.display = 'none';
        if (uploadProgress) uploadProgress.classList.add('d-none');
      }
      if (DebugConsole) console.log("[inputPhotoFile] fichier uplader ");
    });
  }

  /* ===============================
      FONCTION : RENDER CHECKBOXES ALLERGÈNES
     =============================== */
  function renderAllergenesCheckboxes(selectedIds = []) {

    // Vérifier que le conteneur existe
    if (!allergenesContainer) return;

    allergenesContainer.innerHTML = '';

    // Parcours tous les allergènes présent en BDD
    allAllergenes.forEach(allergene => {

      let checked = '';
      // Vérifie si l'allergène doit être coché
      if (selectedIds.includes(allergene.id)) {
        checked = 'checked';
      }
      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
        <input 
          class="form-check-input allergene-check" 
          type="checkbox" 
          value="${allergene.id}" 
          id="allerg-${allergene.id}" 
          ${checked}
        >
        <label 
          class="form-check-label" 
          for="allerg-${allergene.id}">
          ${allergene.libelle}
        </label>
      `;

      // Ajout des données dans le conteneur principal
      allergenesContainer.appendChild(div);
    });
  }

  /* ===============================
      FONCTION : CHARGER LES PLATS PRESENT EN DDB
     =============================== */
  async function loadPlats() {

    try {
      if (DebugConsole) console.log("[loadPlat] Début - Appel GET");
      
      /* ---------------------------------------
       * Récupération des données via API
         ---------------------------------------*/
      const platsRes = await fetch(apiGetPlats, {
        method: 'GET',
        headers: authHeaders
      });
      if (DebugConsole) console.log("[loadPlat] Réponse status platsRes:", platsRes.status);
      if (!platsRes.ok) {
        if (DebugConsole) console.log("[loadPlat] érreur Réponse:", platsRes);
        console.error('[loadPlat] Erreur platsRes:', err);
        return;
      }

      /* ---------------------------------------
       * Traitement des plats
         ---------------------------------------*/
      let platsData = {};

      if (platsRes) {
        try {
          platsData = await platsRes.json();
        } catch (error) {
          platsData = {};
        }
      }
      if (DebugConsole) console.log("[loadPlat] Plat récuperer avec succès  :", platsRes.status, platsData);

      // Test si les données existe
      if (platsData.plats) {
        allPlats = platsData.plats;
      } else {
        allPlats = [];
      }

      renderPlats(allPlats);
      if (DebugConsole) console.log("[loadPlat] Plat :",allPlats);
      if (DebugConsole) {
        console.log("[loadPlat] Plats :", allPlats.length);
        console.log("[loadPlat] Fin - Appel GET");
      }

    } catch (err) {
      console.error('[loadPlat] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : AFFICHER LES PLATS DANS LE DOM
     =============================== */
  function renderPlats(plats) {

    // Vérifie que la liste existe
    if (!platsList) {
      if (DebugConsole) console.log("[renderPlats] platsList introuvable");
      return;
    }

    // Reset affichage
    platsList.innerHTML = '';

    // Vérifie s'il y a des plats
    if (plats.length === 0) {
      if (DebugConsole) console.log("[renderPlats] aucun plat à afficher");
      // Message si aucun résultat
      platsList.innerHTML = '<p class="text-center text-muted">Aucun plat trouvé.</p>';
      return;
    }

    // Boucle sur les plats
    plats.forEach(function(plat) {
      if (DebugConsole) {
        console.log("[renderPlats] plat :", {
          id: plat.id,
          titre: plat.titre,
          categorie: plat.categorie
        });
      }

      // Gestion des allergènes
      let allergLabels = '';
      if (plat.allergenes && plat.allergenes.length) {
        allergLabels = plat.allergenes.map(a => a.libelle).join(', ');
      }

      // Création de la ligne 
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 mb-2 rounded';

      row.style.backgroundColor = '#fdf8f0';
      row.style.border = '1px solid #e8ddd0';

      // Gestion de l'image
      let imageHtml = '';

      if (plat.photo) {
        // Si une image existe
        imageHtml = `<img src="${plat.photo}" alt="${plat.titre}" 
          style="width:60px;height:60px;object-fit:cover;border-radius:0.5rem;">`;
      } else {
        // Sinon image par défaut
        imageHtml = `<div style="width:60px;height:60px;background:#e8ddd0;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;">
          <i class="bi bi-image text-muted"></i>
        </div>`;
      }

      // Remplit le HTML
      row.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          ${imageHtml}
          <div>
            <strong>${plat.titre || 'Sans titre'}</strong>
            <span class="badge bg-secondary ms-2">${plat.categorie || ' '}</span><br>
            <small class="text-muted">Allergènes : ${allergLabels}</small>
          </div>
        </div>
        <div class="d-flex flex-column gap-2">
          <button 
            class="btn btn-secondary btn-sm btn-edit-plat" 
            data-id="${plat.id}" 
            title="Modifier">
            <i class="bi bi-pencil-fill me-1"></i> Modifier
          </button>
          <button 
            class="btn btn-danger btn-sm btn-delete-plat" 
            data-id="${plat.id}" 
            data-titre="${plat.titre}" 
            title="Supprimer">
            <i class="bi bi-trash-fill me-1"></i> Supprimer
          </button>
        </div>
      `;
      platsList.appendChild(row);
    });

    /* ---------------------------------------
      * EVENT : Gestion des boutons supprimer
      ---------------------------------------*/
    document.querySelectorAll('.btn-delete-plat').forEach(function(btn) {

      btn.addEventListener('click', function() {
        if (DebugConsole) console.log("[delete] clic sur :", btn.dataset.id, btn.dataset.titre);
        // Récupère l'id du plat
        currentDeleteId = btn.dataset.id;
        // Affiche le nom du plat dans la modale
        deletePlatName.textContent = btn.dataset.titre;
        // Ouvre la modale
        deleteModal.show();
      });
    });

    /* ---------------------------------------
      * EVENT : Gestion des boutons modifier
      ---------------------------------------*/
    document.querySelectorAll('.btn-edit-plat').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (DebugConsole) console.log("[edit] clic sur :", btn.dataset.id);
        // Appelle la fonction d'édition avec l'id du plat
        openEditForm(parseInt(btn.dataset.id));
      });
    });
    if (DebugConsole) console.log("[renderPlats] affichage terminé");
  }

  /* ===============================
      FONCTION : CRÉATION FORMULAIRE POUR CREER UN PLAT
     =============================== */
  function openCreateForm() {
    currentEditId = null;
    platFormTitle.textContent = 'Créer un plat';
    btnSavePlat.innerHTML = '<i class="bi bi-save me-1"></i> Créer le plat';

    inputTitre.value = '';
    selectCategorie.value = 'Entrée';
    inputDescription.value = '';

    // Reset photo
    inputPhotoFile.value = '';
    inputPhotoUrl.value = '';
    photoPreview.style.display = 'none';

    renderAllergenesCheckboxes([]);

    platFormCard.classList.remove('d-none');
    platFormCard.scrollIntoView({ behavior: 'smooth' });
  }

  /* ===============================
      FONCTION : MODIFICATION FORMULAIRE 
     =============================== */
  function openEditForm(platId) {

    // Trouver le plat correspondantd'après son ID
    const plat = allPlats.find(function(p) {
      return p.id === platId;
    });

    // Si aucun plat trouvé on arrête
    if (!plat) {
      if (DebugConsole) console.log("[openEditForm] plat introuvable :", platId);
      return;
    }
    if (DebugConsole) {
      console.log("[openEditForm] édition du plat :", plat);
    }

    // Initialisation avec le nouveaux ID
    currentEditId = platId;

    // Modifier le titre du formulaire avec le nouveaux titre
    platFormTitle.textContent = "Modifier : " + (plat.titre || '');

    // Modifier le bouton sauvegarder
    btnSavePlat.innerHTML = '<i class="bi bi-save me-1 "></i> Enregistrer';

    // Remplir les champs
    inputTitre.value = plat.titre || '';
    selectCategorie.value = plat.categorie || 'Entrée';
    inputDescription.value = plat.description || '';

    // Stocke l'URL existante dans le hidden input
    inputPhotoUrl.value = plat.photo || '';
    // Reset le file input
    inputPhotoFile.value = '';


    // Gestion de l'aperçu de l'image
    if (plat.photo) {
      // Si une image existe
      photoPreview.src = plat.photo;
      photoPreview.style.display = 'block';
    } else {
      // Sinon on cache l'image
      photoPreview.style.display = 'none';
    }

    // Gestion des allergènes
    let selectedIds = [];
    if (plat.allergenes) {
      selectedIds = plat.allergenes.map(function(a) {
        return a.id;
      });
    }
    if (DebugConsole) {
      console.log("[openEditForm] allergènes sélectionnés :", selectedIds);
    }

    // Générer les checkboxes avec les allergènes cochés
    renderAllergenesCheckboxes(selectedIds);

    // Affiche le formulaire
    platFormCard.classList.remove('d-none');

    // Scroll vers le formulaire
    platFormCard.scrollIntoView({
      behavior: 'smooth'
    });

    if (DebugConsole) { console.log("[openEditForm] formulaire prêt");}
  }
  
  /* ===============================
      SAUVEGARDER : CRÉER OU MODIFIER UN PLAT
     =============================== */
  btnSavePlat.addEventListener('click', async () => {

    const titre_plat = inputTitre.value.trim();
    const categorie = selectCategorie.value;
    const description_plat = inputDescription.value.trim();

    // Récupère l'URL depuis le hidden input (uploadée ou existante en edit)
    const photo = inputPhotoUrl.value.trim();

    if (DebugConsole) { console.log("[btnSavePlat] photo:",photo );}
    // Récupérer les allergènes cochés
    const allergenes = [];
    document.querySelectorAll('.allergene-check:checked').forEach(cb => {
      allergenes.push(parseInt(cb.value));
    });

    // Validations
    if (!titre_plat) { showToast("Le titre est obligatoire.", "error"); return; }
    if (!photo) { showToast("Veuillez uploader une photo.", "error"); return; }
    if (!categorie) { showToast("La catégorie est obligatoire.", "error"); return; }

    if (DebugConsole) { console.log("[btnSavePlat] :",titre_plat,photo,categorie,allergenes );}

    const body = { titre_plat, categorie, photo, allergenes };
    if (description_plat) body.description_plat = description_plat;

    const isEdit = currentEditId !== null;
    const url = isEdit ? `${apiEmployePlats}/${currentEditId}` : apiEmployePlats;
    const method = isEdit ? 'PUT' : 'POST';

    if (DebugConsole) console.log(`[btnSavePlat] ${method}`, url, body);

    try {
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast(isEdit ? "Plat modifié avec succès !" : "Plat créé avec succès !");
        platFormCard.classList.add('d-none');
        currentEditId = null;
        loadPlats();
      } else {
        showToast(data.message || "Erreur lors de la sauvegarde.", "error");
      }
    } catch (err) {
      console.error('[savePlat] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }
  });

   /* ---------------------------------------
    * EVENT : SUPPRESSION MODALE
     ---------------------------------------*/
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentDeleteId) return;

    const url = `${apiEmployePlats}/${currentDeleteId}`;
    if (DebugConsole) console.log("[deletePlat] DELETE", url);

    try {
      const response = await fetch(url, { method: 'DELETE', headers: authHeaders });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.ok) {
        showToast("Plat supprimé !");
        loadPlats();
      } else {
        showToast(data.message || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error('[deletePlat] Erreur :', err);
      showToast("Erreur réseau.", "error");
    }

    deleteModal.hide();
    currentDeleteId = null;
  });

  /* ===============================
      FONCTION : APPLIQUER LES FILTRES (recherche + catégorie)
        Recherche par titre par catégory ou par allergènes
        Select par catégorie (Entrée/Plat/Dessert)
     =============================== */
  function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const categorie = filterCategorie ? filterCategorie.value : '';

    if (DebugConsole) console.log("[applyFilters] search:", search, "categorie:", categorie);

    const filtered = allPlats.filter(plat => {

      // Filtre catégorie
      if (categorie) {
        if ((plat.categorie || '') !== categorie) return false;
      }

      // Filtre recherche texte
      if (search) {
        const titre = (plat.titre || '').toLowerCase();
        const cat = (plat.categorie || '').toLowerCase();
        const allergenes = plat.allergenes ? plat.allergenes.map(a => a.libelle).join(' ').toLowerCase() : '';
        if (!titre.includes(search) && !cat.includes(search) && !allergenes.includes(search)) return false;
      }

      return true;
    });

    renderPlats(filtered);
  }

  /* ===============================
      LISTENERS FILTRES
     =============================== */
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (filterCategorie) {
    filterCategorie.addEventListener('change', applyFilters);
  }
  /* ===============================
      LISTENERS
     =============================== */
  btnNewPlat.addEventListener('click', openCreateForm);
  btnCancelPlat.addEventListener('click', () => {
    platFormCard.classList.add('d-none');
    currentEditId = null;
  });

  loadAllergenes().then(() => loadPlats());
}