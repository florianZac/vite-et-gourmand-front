import { API_URL } from '../config.js';
import { getToken, getRole, sanitizeInput, sanitizeHtml } from '../script.js';
export function initDetailMenusPage() {

/* ===============================
    SCRIPT PAGE DÉTAIL MENU
    Gère :
      1. La récupération de l'ID du menu depuis l'URL
      2. Le chargement des données du menu depuis l'API (GET)
      3. L'affichage de toutes les informations dans le DOM
      4. La galerie photos (clic miniature + flèches)
      5. Le bouton "Commander" (redirection selon connexion)
      6. La composition du menu (Entrée, Plat, Dessert)
      7. La modale édition photo (titre + description + upload)
      8. La modale suppression photo (double vérification)
	 =============================== */

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération  des menus
  const apiMenusUrl = `${API_URL}/api/menus`;
  
  // EndPoint de l'API pour l'Upload image via Cloudinary
  const apiUploadImage = `${API_URL}/api/employe/upload/image`;
  
  // EndPoint de l'API pour la gestion CRUD plats
  const apiEmployePlats = `${API_URL}/api/employe/plats`;

	/* ===============================
		  RÉCUPÉRATION DE L'ID DU MENU DEPUIS L'URL
        - 1.  L'URL est de la forme /detail_menu?id=3
        - 2.	On récupère le paramètre "id" depuis le query string
		 =============================== */
  let DebugConsole = true;

	// Découpe l'URL 
  const params = new URLSearchParams(window.location.search);
  const menuId = params.get('id');

	// Si pas d'ID valide, on ne peut rien charger
  if (!menuId || isNaN(menuId)) {
    console.error('ID de menu invalide:', menuId);
    return;
  }
  
  /* ===============================
      RÉCUPÉRATION DU TOKEN
     =============================== */
  const token = getToken();
  const authHeaders = token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
  const role = getRole();

  if (DebugConsole) {
    console.log("=== DEBUG INIT Detail Menus ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel :", token);
    console.log("Rôle actuel :", role);
    console.log("[init] ID du menu récupéré :", menuId);
    console.log("================================");
  }

  /* ===============================
      RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     =============================== */

  // Breadcrumb
  const breadcrumbName = document.getElementById('breadcrumb-menu-name');

  // Galerie
  const galleryMainImg = document.getElementById('gallery-main-img');
  const galleryThumbs = document.getElementById('gallery-thumbs');
  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');

  // Infos du menu
  const detailBadges = document.getElementById('detail-badges');
  const detailTitle = document.getElementById('detail-title');
  const detailDescription = document.getElementById('detail-description');
  const detailTags = document.getElementById('detail-tags');
  const detailPrice = document.getElementById('detail-price');
  const detailMinPersons = document.getElementById('detail-min-persons');
  const detailReduction = document.getElementById('detail-reduction');
  const detailConditions = document.getElementById('detail-conditions');

  // Bouton commander
  const btnOrder = document.getElementById('btn-order-menu');

  // Composition
  const compositionGrid = document.getElementById('composition-grid');

  // Modale édition photo
  const editPhotoFile = document.getElementById('edit-photo-file');
  const editPhotoTitle = document.getElementById('edit-photo-title');
  const editPhotoPreviewImg = document.getElementById('edit-photo-preview-img');
  const btnSavePhoto = document.getElementById('btn-save-photo');
  const editPhotoDescription = document.getElementById('edit-photo-description');

  // Modale suppression photo
  const deletePhotoPreviewImg = document.getElementById('delete-photo-preview-img');
  const deleteStep1 = document.getElementById('delete-step-1');
  const deleteStep2 = document.getElementById('delete-step-2');
  const deleteConfirmInput = document.getElementById('delete-confirm-input');
  const deleteConfirmError = document.getElementById('delete-confirm-error');
  const btnDeleteContinue = document.getElementById('btn-delete-continue');
  const btnDeleteConfirm = document.getElementById('btn-delete-confirm');
  const btnDeleteCancel = document.getElementById('btn-delete-cancel');

	/* ===============================
			VARIABLES GLOBALES
		 =============================== */

	// Tableau des plats du menu (chaque plat a { id, titre, categorie, photo })
  let plats = [];

  // Index du plat/photo actuellement affiché en grand
  let currentPhotoIndex = 0;

	/* ===============================
		  FONCTION : CHARGER LES DONNÉES DU MENU DEPUIS L'API
        -	1.	Appelle GET /api/menus/{id}
        - 2.	Remplit tous les éléments du DOM
		 =============================== */

	async function loadMenuDetail() {
    const url = `${apiMenusUrl}/${menuId}`;
    if (DebugConsole) console.log("[loadMenuDetail] Début - Appel GET", url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (DebugConsole) console.log("[loadMenuDetail] Réponse status :", response.status);

      if (!response.ok) {
        console.error('[loadMenuDetail] Erreur chargement détail menu:', response.status);
        return;
      }

      let data = null;
      // évite que le script crash si la réponse n'est pas du JSON
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      const menu = data.menu;
      if (!menu) {
        console.error('[loadMenuDetail] Pas de données menu dans la réponse');
        return;
      }

      if (DebugConsole) console.log("[loadMenuDetail] Menu chargé :", menu);

      // Stocke les plats dans la variable globale
      plats = menu.plats || [];

			// Remplit chaque section de la page
      renderBreadcrumb(menu);
      renderBadges(menu);
      renderMainInfo(menu);
      renderTags(menu);
      renderPriceCard(menu);
      renderConditions(menu);
      renderGallery(menu);
      renderComposition(menu);
      setupOrderButton(menu);

    } catch (err) {
      console.error('[loadMenuDetail] Erreur réseau :', err);
    }
  }

  /* ===============================
      FONCTION : FIL D'ARIANE
        - Affiche le titre du menu dans le breadcrumb
     =============================== */

  function renderBreadcrumb(menu) {
    // Vérifie si breadcrumbName existe
    if (breadcrumbName) {
      // Si menu.titre existe, on l'affiche, sinon ' '
      if (menu && menu.titre) {
        breadcrumbName.textContent = menu.titre;
      } else {
        breadcrumbName.textContent = ' ';
      }

      if (DebugConsole) {
        console.log("[renderBreadcrumb] chargé :", breadcrumbName.textContent);
      }
    } 
  }

  /* ===============================
      FONCTION : BADGES (thème + régime + disponibilité)
        - theme est un objet { id, titre }
        - regime est un objet { id, libelle }
        - Disponibilité basée sur quantite_restante > 0
     =============================== */

 function renderBadges(menu) {
    if (!detailBadges) return;

    detailBadges.innerHTML = '';

    // Badge thème
    if (menu.theme && menu.theme.titre) {
      detailBadges.innerHTML += `<span class="detail_menu-badge-theme">${sanitizeHtml(menu.theme.titre)}</span>`;
    }

    // Badge régime
    if (menu.regime && menu.regime.libelle) {
      detailBadges.innerHTML += `<span class="detail_menu-badge-regime"> ${sanitizeHtml(menu.regime.libelle)}</span>`;
    }

    // Badge disponibilité
    const disponible = menu.quantite_restante >= menu.nombre_personne_minimum;
    if (disponible) {
      detailBadges.innerHTML += `<span class="detail_menu-badge-available"><i class="bi bi-check"></i> Disponible à la commande</span>`;
    } else {
      detailBadges.innerHTML += `<span class="detail_menu-badge-unavailable"><i class="bi bi-x"></i> Indisponible</span>`;
    }

    // Badge menus restants affichant le nombre de menus réellement commandables
    let restant = 0;
    if (menu.quantite_restante && menu.nombre_personne_minimum) {
      restant = Math.floor(menu.quantite_restante / menu.nombre_personne_minimum);

      if (restant > 0 && restant <= 10) {
        detailBadges.innerHTML += `
          <span class="detail_menu-badge-stock">
            Plus que ${(restant)} menu${(restant) > 1 ? 's' : ''} disponible${(restant) > 1 ? 's' : ''}
          </span>
        `;
      }
    }

  if (DebugConsole) console.log("[renderBadges] Thème:", menu.theme?.titre, "Régime:", menu.regime?.libelle, "Dispo:", disponible, "Menus restant:", restant );
}

	/* ===============================
			FONCTION : INFOS PRINCIPALES (titre + description)
		 =============================== */

  function renderMainInfo(menu) {
    // Vérifie que detailTitle existe
    if (detailTitle) {
      if (menu && menu.titre) {
        detailTitle.textContent = menu.titre;
      } else {
        detailTitle.textContent = ' ';
      }
    }

    // Vérifie que detailDescription existe
    if (detailDescription) {
      if (menu && menu.description) {
        detailDescription.textContent = menu.description;
      } else {
        detailDescription.textContent = '';
      }
    }

    // Debug : affiche le titre si DebugConsole est activé
    if (DebugConsole) {
      if (menu && menu.titre) {
        console.log("[renderMainInfo] Titre:", menu.titre);
      } else {
        console.log("[renderMainInfo] Titre indisponible");
      }
    }
  }

	/* ===============================
			FONCTION : TAGS (ingrédients principaux)
        menu.tags retourné par l'API
		 =============================== */

 function renderTags(menu) {
    if (!detailTags) return;

    detailTags.innerHTML = '';

    const tags = menu.tags || [];
    tags.forEach(tag => {
      if (tag && tag.tag) {
        detailTags.innerHTML += `<span class="detail_menu-tag">${sanitizeHtml(tag.tag)}</span>`;
      }
    });

    if (DebugConsole) console.log("[renderTags] Tags:", tags);
  }

	/* ===============================
		  FONCTION : CARD PRIX
        - 1.	Prix par personne
        - 2.	Minimum de personnes
        - 3.	Texte de réduction "-10% à partir de X personnes supplémentaires"
        où X = nombre_personne_minimum + 5 (règle métier)
		 =============================== */

  function renderPriceCard(menu) {
    // Vérifie que detailPrice existe
    if (detailPrice) {
      if (menu && menu.prix_par_personne) {
        detailPrice.textContent = menu.prix_par_personne;
      } else {
        detailPrice.textContent = 0;
      }
    }

    // Vérifie que detailMinPersons existe
    if (detailMinPersons) {
      if (menu && menu.nombre_personne_minimum) {
        detailMinPersons.textContent = menu.nombre_personne_minimum;
      } else {
        detailMinPersons.textContent = 0;
      }
      if (DebugConsole) console.log("[detailMinPersons]:", detailMinPersons.textContent);
    }

    // Texte de réduction dynamique basé sur la règle métier
    // Réduction de 10% si nombre_personnes > nombre_personne_minimum + 5
    if (detailReduction) {
      let minPersons = menu?.nombre_personne_minimum || 0;
      const seuilReduction = minPersons + 5;
      if (DebugConsole) console.log("[detailReduction] minPersons:",minPersons);

      detailReduction.innerHTML = `<i class="bi bi-tag"></i> Réduction de 10% à partir de ${seuilReduction} personnes`;
      detailReduction.style.display = 'block';
      if (DebugConsole) console.log("[renderPriceCard] Prix:", menu.prix_par_personne, "Min:", menu.nombre_personne_minimum);
    }
  }

	/* ===============================
		  FONCTION : CONDITIONS DU MENU
        - 1. Texte dynamique basé sur le nombre min de personnes
        - 2. Délai de réservation + acompte
          Si menu.conditions existe, on l'utilise à la place
		 =============================== */

  function renderConditions(menu) {
    if (!detailConditions) return;

    // Si le back retourne un champ conditions spécifique, on l'utilise
    if (menu.conditions) {
      detailConditions.textContent = menu.conditions;
    } else {
      const minPersons = menu.nombre_personne_minimum || 0;
      detailConditions.textContent =
        `Commande minimum ${minPersons} personnes. ` +
        `Réservation au moins 7 jours avant la prestation. ` +
        `Acomptes de 30% à la commande.`;
    }

    if (DebugConsole) console.log("[renderConditions] Conditions affichées",detailConditions.textContent);
  }

	/* ===============================
      FONCTION : GALERIE PHOTOS
        - Les photos viennent des plats du menu : plats[x].photo
        - Chaque plat a une catégorie (Entrée, Plat, Dessert)
        - Photo 1 = entrée, Photo 2 = plat, Photo 3 = dessert
        - Miniatures cliquables + flèches prev/next
		 =============================== */

  function renderGallery(menu) {
    if (DebugConsole) console.log("[renderGallery] Nombre de plats :", plats.length);

    // Si pas de plats ou pas de photos, affiche un placeholder
    if (plats.length === 0) {
      if (galleryMainImg) {
        galleryMainImg.src = '/Assets/Images/Réveillon_Étoilé.jpg';
        galleryMainImg.alt = menu.titre || 'Menu';
      }
      return;
    }
    
    // Affiche la première photo en grand
    currentPhotoIndex = 0;
    updateMainPhoto();

    // Génère les miniatures
    renderThumbnails();
  }

	/* ===============================
		  FONCTION : METTRE À JOUR LA PHOTO PRINCIPALE
        - 1.	Affiche la photo à l'index currentPhotoIndex
        - 2.	Met à jour la miniature active
        - 3.	Affiche ou cache les boutons action pour admin/employé
		 =============================== */

  function updateMainPhoto() {
    if (!galleryMainImg || plats.length === 0) return;

    const currentPlat = plats[currentPhotoIndex];

    // Met à jour la source et le texte alt de l'image principale
    galleryMainImg.src = currentPlat.photo || '/Assets/Images/Réveillon_Étoilé.jpg';
    galleryMainImg.alt = currentPlat.titre || `Photo ${currentPhotoIndex + 1}`;

    if (DebugConsole) console.log(`[updateMainPhoto] Photo ${currentPhotoIndex} : ${currentPlat.titre} (${currentPlat.categorie})`);

    // Affiche ou cache les boutons admin/employé sur la photo principale
    // Les boutons sont cachés par défaut (d-none dans le HTML)
		// On les affiche uniquement si le token JWT contient ROLE_ADMIN ou ROLE_EMPLOYE
    const actionButtons = document.getElementById('action-image-buttons');
    if (actionButtons) {
      // Vérifie si l'utilisateur a le rôle admin ou employé
      if (role === 'ROLE_ADMIN' || role === 'ROLE_EMPLOYE') {
        actionButtons.classList.remove('d-none');
      } else {
        actionButtons.classList.add('d-none');
      }
    }
    if (DebugConsole) console.log("[updateMainPhoto] Role",role);
    // Met à jour la miniature active
		// Retire la classe "active" de toutes les miniatures
		// puis l'ajoute uniquement sur celle correspondant à currentPhotoIndex
    const thumbs = galleryThumbs?.querySelectorAll('.detail_menu-gallery-thumb');
    if (thumbs) {
      thumbs.forEach((thumb, index) => {
        if (index === currentPhotoIndex) {
          thumb.classList.add('active');
        } else {
          thumb.classList.remove('active');
        }
      });
    }
  }

	/* ===============================
      FONCTION : GÉNÉRER LES MINIATURES
          - 1.	Crée une miniature par plat/photo (max 3)
          - 2.	Au clic sur une miniature la photo cliquée devient la photo principale
		 =============================== */

  function renderThumbnails() {
    if (!galleryThumbs) return;
    galleryThumbs.innerHTML = '';
    // Maximum 3 photos (entrée, plat, dessert)
    const maxPhotos = Math.min(plats.length, 3);
    for (let i = 0; i < maxPhotos; i++) {
      const thumb = document.createElement('div');
      thumb.className = `detail_menu-gallery-thumb ${i === currentPhotoIndex ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${sanitizeHtml(plats[i].photo)}" alt="${sanitizeHtml(plats[i].titre) || 'Photo ' + (i + 1)}">`;
      // Au clic cette photo devient la photo principale
      thumb.addEventListener('click', () => {
        currentPhotoIndex = i;
        updateMainPhoto();
      });
      galleryThumbs.appendChild(thumb);
    }
    if (DebugConsole) console.log("[renderThumbnails] Miniatures générées :", maxPhotos);
  }

	/* ===============================
      LISTENERS : FLÈCHES DE NAVIGATION GALERIE
		 =============================== */
  if (DebugConsole) console.log("[initial] IndexPhoto :", currentPhotoIndex);
	// Flèche précédente
	if (galleryPrev) {
		galleryPrev.addEventListener('click', () => {
			if (plats.length === 0) return;
			// Si on est à la première photo, on boucle vers la dernière
			currentPhotoIndex = (currentPhotoIndex - 1 + plats.length) % plats.length;
			updateMainPhoto();
		});
    if (DebugConsole) console.log("[galleryPrev] IndexPhoto :", currentPhotoIndex);
	} 

	// Flèche suivante
	if (galleryNext) {
		galleryNext.addEventListener('click', () => {
			if (plats.length === 0) return;
			// Si on est à la dernière photo, on boucle vers la première
			currentPhotoIndex = (currentPhotoIndex + 1) % plats.length;
			updateMainPhoto();
		});
     if (DebugConsole) console.log("[galleryNext] IndexPhoto :", currentPhotoIndex);
	}

   /* ===============================
        FONCTION : COMPOSITION DU MENU
          - Affiche les plats groupés par catégorie (Entrée, Plat, Dessert)
          - Chaque card : icône + catégorie + titre du plat + description
          - Les données viennent de menu.plats[{ id, titre, categorie, photo }]
      =============================== */
  function renderComposition(menu) {
    if (!compositionGrid) return;

    compositionGrid.innerHTML = '';

    // Configuration des catégories avec icônes
    const categoryData = [
      ['ENTRÉE', 'bi bi-egg-fried', 'Entrée'],
      ['PLAT', 'bi bi-cup-hot', 'Plat'],
      ['DESSERT', 'bi bi-cake2', 'Dessert']
    ];

    const categories = categoryData.map(([label, iconClass, key]) => ({
      label,
      icon: `<i class="${iconClass}"></i>`,
      key
    }));
    if (DebugConsole) console.log("[renderComposition] categories :", categories);

    const menuPlats = menu.plats || [];

    if (DebugConsole) console.log("[renderComposition] menuPlats :", menuPlats);

    categories.forEach(cat => {
      // Trouve le plat correspondant à cette catégorie
      const plat = menuPlats.find(p => p.categorie === cat.key);

      if (DebugConsole) console.log(`[renderComposition] ${cat.label} :`, plat ? plat.titre : 'Aucun');

      // Titre et description du plat (ou fallback)
      const platTitre = plat ? plat.titre : ' ';
      let allergens = [];

      if (plat && plat.allergenes) {
        allergens = plat.allergenes;
      }

      if (DebugConsole) console.log("[allergenes]", allergens);

      let allergensHtml = '';

      if (allergens.length > 0) {
        for (let i = 0; i < allergens.length; i++) {
          allergensHtml += '<span class="detail_menu-dish-allergen-badge">' + sanitizeHtml(allergens[i].libelle) + '</span>';
        }
      } else {
        allergensHtml = '<span class="detail_menu-dish-allergen-none">Aucun</span>';
      }
      
      // Crée la colonne Bootstrap + la card
      const col = document.createElement('div');
      col.className = 'col-12 col-lg-4 mb-3';
      col.innerHTML = `
        <div class="detail_menu-dish-card">
          <div class="detail_menu-dish-type">
            <span class="detail_menu-dish-type-icon">${cat.icon}</span>
            <span class="detail_menu-dish-type-label">${cat.label}</span>
          </div>
          <h3 class="detail_menu-dish-name">${sanitizeHtml(platTitre) || ' '}</h3>
          <p class="detail_menu-dish-description">${plat ? sanitizeHtml(plat.description || '') : ''}</p>
          <div class="detail_menu-dish-allergens-label">
            <i class="bi bi-shield-exclamation"></i>
            <span>Allergènes :</span>
          </div>
          <div class="detail_menu-dish-allergens">${allergensHtml}</div>
        </div>
      `;
      compositionGrid.appendChild(col);
    });
    if (DebugConsole) console.log("[renderComposition] Composition affichée");
  }

  /* ===============================
      FONCTION : BOUTON COMMANDER
        - Si le menu est indisponible le bouton est désactivé
        - Si l'utilisateur n'est pas connecté on redirige vers /login
        - Si connecté + rôle ROLE_CLIENT on redirige vers /commander
        - Sinon (employé, admin) on redirige vers /
     =============================== */
 function setupOrderButton(menu) {
    if (!btnOrder) return;

    // Si le menu est indisponible, on désactive le bouton
    const disponible = menu.quantite_restante >= menu.nombre_personne_minimum;
    if (!disponible) {
      btnOrder.disabled = true;
      btnOrder.innerHTML = '<i class="bi bi-x-circle"></i> Menu indisponible';
      if (DebugConsole) console.log("[setupOrderButton] Menu indisponible, bouton désactivé");
      return;
    }

    btnOrder.addEventListener('click', () => {
      if (!token) {
        // Pas connecté redirection vers page de connexion
        if (DebugConsole) console.log("[setupOrderButton] Pas de token, redirection login");
        window.location.href = '/login';
        return;
      }


      if (role === 'ROLE_CLIENT') {
        // Client connecté on redirige vers la page commande avec l'ID du menu
        window.location.href = `/commander?menu_id=${menu.id}`;
      } else {
        // Employé ou admin n'a pas accès à la commande
        console.log('Accès commande réservé aux clients');
        window.location.href = '/';
      }
    });
  }

	/* ===============================
      MODALE ÉDITION PHOTO (EditionPhotoModal)
        - Quand la modale s'ouvre : pré-remplit la prévisualisation avec la photo actuelle
        - L'utilisateur peut :
          1. Sélectionner une nouvelle image (prévisualisation en temps réel) avec fileReader
          2. Saisir un titre
          3. Saisir une description 
        - Au clic sur "Sauvegarder" on envoie le tout à l'API en POST avec FormData
		 =============================== */
	// Quand la modale édition s'ouvre
	// Pré-remplit la prévisualisation avec la photo actuellement affichée en grand
	const editionModal = document.getElementById('EditionPhotoModal');
	if (editionModal) {
    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {
      editionModal.addEventListener('show.bs.modal', () => {
        const currentPlat = plats[currentPhotoIndex];
        if (!currentPlat) return;

        // Affiche la photo actuelle dans la prévisualisation
        if (editPhotoPreviewImg) {
          editPhotoPreviewImg.src = currentPlat.photo || '';
        }
        // Pré-remplit le titre avec le titre du plat
        if (editPhotoTitle) {
          editPhotoTitle.value = currentPlat.titre || '';
        }
        // Pré-remplit la description avec la description du plat
        if (editPhotoDescription) {
          editPhotoDescription.value = currentPlat.description || '';
        }
        // Reset le file input
        if (editPhotoFile) editPhotoFile.value = '';
      });
    }
  }

	// Prévisualisation en temps réel quand l'utilisateur sélectionne un fichier
	// Utilise FileReader pour lire le fichier image et l'afficher dans l'aperçu
	if (editPhotoFile) {

    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {

      editPhotoFile.addEventListener('change', () => {
        // Récupère le fichier sélectionné
        const file = editPhotoFile.files[0];
        if (!file) return;

        // Crée un FileReader pour lire le fichier
        // permet d'afficher l'image dans la modale AVANT l'envoi à l'API
        const reader = new FileReader();

        // Quand la lecture est terminée on met à jour l'aperçu
        reader.onload = (e) => {
          if (editPhotoPreviewImg) editPhotoPreviewImg.src = e.target.result;
        };
        // Lance la lecture du fichier en Data URL
        reader.readAsDataURL(file);
      });
    }
  }

	// Bouton "Sauvegarder" dans la modale édition
	// Envoie le fichier + titre + description à l'API
  if (btnSavePhoto) {
    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {
      btnSavePhoto.addEventListener('click', async () => {
        const file = editPhotoFile?.files[0];
        const title = editPhotoTitle?.value?.trim() || '';

        if (!file) {
          alert('Veuillez sélectionner une image.');
          return;
        }
        if (!title) {
          alert('Veuillez saisir un titre pour l\'image.');
          return;
        }
        if (!token) return;

        const currentPlat = plats[currentPhotoIndex];
        if (!currentPlat) return;

        if (DebugConsole) console.log(`[btnSavePhoto] Upload photo pour plat ${currentPlat.id}`);

        try {
          // Étape 1 : Upload vers Cloudinary via le back
          const formData = new FormData();
          formData.append('image', file);

          const uploadRes = await fetch(apiUploadImage, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });

          let uploadData = {};
          try { uploadData = await uploadRes.json(); } catch { uploadData = {}; }

          if (!uploadRes.ok) {
            alert(uploadData.message || 'Erreur upload image.');
            return;
          }

          const newPhotoUrl = uploadData.url;
          if (DebugConsole) console.log("[btnSavePhoto] URL Cloudinary :", newPhotoUrl);

          // Étape 2 : Met à jour le plat avec la nouvelle URL + description
          const description = sanitizeHtml(editPhotoDescription?.value?.trim() || '');
          const bodyData = { photo: sanitizeHtml(newPhotoUrl )};
          if (description) bodyData.description_plat = description;

          const updateRes = await fetch(`${apiEmployePlats}/${currentPlat.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
          });

          let updateData = {};
          try { updateData = await updateRes.json(); } catch { updateData = {}; }

          if (updateRes.ok) {
            if (DebugConsole) console.log("[btnSavePhoto] Plat mis à jour avec succès");

            // Met à jour localement
            plats[currentPhotoIndex].photo = newPhotoUrl;

            // Rafraîchit la galerie
            updateMainPhoto();
            renderThumbnails();

            // Ferme la modale
            const modalInstance = bootstrap.Modal.getInstance(editionModal);
            if (modalInstance) modalInstance.hide();
          } else {
            alert(updateData.message || 'Erreur lors de la mise à jour du plat.');
          }

        } catch (err) {
          console.error('[btnSavePhoto] Erreur :', err);
          alert('Erreur réseau, veuillez réessayer.');
        }
      });
    }
  }

	/* ===============================
      MODALE SUPPRESSION PHOTO (SuppresionPhotoModal)
        - Double vérification en 2 étapes :
          Étape 1 : Aperçu de la photo + message d'avertissement + bouton "Continuer"
          Étape 2 : L'utilisateur doit taper "SUPPRIMER" pour activer le bouton final
        - Au clic sur "Supprimer définitivement" on envoie DELETE à l'API
        - Endpoint API : DELETE /api/menus/{id}/photos/{index}
        - Protection : impossible de supprimer la dernière photo
		 =============================== */

	// Quand la modale suppression s'ouvre
	// Remet toujours l'étape 1 visible et l'étape 2 cachée
  const suppressionModal = document.getElementById('SuppresionPhotoModal');
  if (suppressionModal) {

    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {

      suppressionModal.addEventListener('show.bs.modal', () => {
      // Affiche la photo actuelle dans l'aperçu de suppression
        if (deletePhotoPreviewImg && plats[currentPhotoIndex]) {
          deletePhotoPreviewImg.src = plats[currentPhotoIndex].photo || '';
        }

        // Remet l'étape 1 visible
        if (deleteStep1) deleteStep1.classList.remove('d-none');
        // Cache l'étape 2
        if (deleteStep2) deleteStep2.classList.add('d-none');

        // Réinitialise le champ de confirmation
        if (deleteConfirmInput) deleteConfirmInput.value = '';
        // Cache le message d'erreur
        if (deleteConfirmError) deleteConfirmError.classList.add('d-none');

        // Affiche le bouton "Continuer" et cache le bouton "Supprimer définitivement"
        if (btnDeleteContinue) btnDeleteContinue.classList.remove('d-none');
        if (btnDeleteConfirm) {
          btnDeleteConfirm.classList.add('d-none');
          btnDeleteConfirm.disabled = true;
        }
      });
    }
	}

	// Bouton "Continuer" (étape 1 vers étape 2)
	// Vérifie qu'il reste plus d'une photo, puis affiche l'étape 2
	if (btnDeleteContinue) {

    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {

      btnDeleteContinue.addEventListener('click', () => {
        // Vérifie qu'il reste plus d'une photo
        if (plats.length <= 1) {
          alert('Impossible de supprimer la dernière photo du menu.');
          return;
        }

        // Cache l'étape 1
        if (deleteStep1) deleteStep1.classList.add('d-none');
        // Affiche l'étape 2 pour le champ de confirmation
        if (deleteStep2) deleteStep2.classList.remove('d-none');

        // Cache le bouton "Continuer"
        btnDeleteContinue.classList.add('d-none');
        // Affiche le bouton "Supprimer définitivement" qui est désactivé par défaut
        if (btnDeleteConfirm) {
          btnDeleteConfirm.classList.remove('d-none');
          btnDeleteConfirm.disabled = true;
        }

        // Met le focus sur le champ de saisie pour faciliter la frappe
        if (deleteConfirmInput) deleteConfirmInput.focus();
      });
    }
	}

	// Champ de saisie "SUPPRIMER" (étape 2)
	// Active ou désactive le bouton "Supprimer définitivement" en temps réel
	if (deleteConfirmInput) {

    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {

      deleteConfirmInput.addEventListener('input', () => {
        // Récupère la valeur saisie et la met en majuscules pour la comparaison
        const value = deleteConfirmInput.value.trim().toUpperCase();

        // Si la valeur correspond à "SUPPRIMER" on active le bouton
        if (value === 'SUPPRIMER') {
          if (btnDeleteConfirm) btnDeleteConfirm.disabled = false;
          if (deleteConfirmError) deleteConfirmError.classList.add('d-none');
        } else {
          // Sinon désactive le bouton
          if (btnDeleteConfirm) btnDeleteConfirm.disabled = true;
        }
      });
    }
	}

	// Bouton "Supprimer définitivement" (étape 3)
	// Envoie le DELETE à l'API puis ferme la modale
	if (btnDeleteConfirm) {
    if ((role === 'ROLE_ADMIN') || (role === 'ROLE_EMPLOYE')) {
      btnDeleteConfirm.addEventListener('click', async () => {
        const value = deleteConfirmInput?.value?.trim().toUpperCase();
        if (value !== 'SUPPRIMER') {
          if (deleteConfirmError) deleteConfirmError.classList.remove('d-none');
          return;
        }

        if (!token) return;

        const currentPlat = plats[currentPhotoIndex];
        if (!currentPlat) return;

        if (DebugConsole) console.log(`[btnDeleteConfirm] Suppression photo plat ${currentPlat.id}`);

        try {
          // Met à jour le plat avec une photo vide
          const response = await fetch(`${apiEmployePlats}/${currentPlat.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ photo: '' })
          });

          let data = {};
          try { data = await response.json(); } catch { data = {}; }

          if (response.ok) {
            if (DebugConsole) console.log("[btnDeleteConfirm] Photo supprimée avec succès");

            // Met à jour localement — vide la photo du plat
            plats[currentPhotoIndex].photo = '';

            // Rafraîchit l'affichage
            updateMainPhoto();
            renderThumbnails();

            // Ferme la modale
            const modalInstance = bootstrap.Modal.getInstance(suppressionModal);
            if (modalInstance) modalInstance.hide();
          } else {
            alert(data.message || 'Erreur lors de la suppression de la photo.');
          }

        } catch (err) {
          console.error('[btnDeleteConfirm] Erreur :', err);
          alert('Erreur réseau, veuillez réessayer.');
        }
      });
    }
  }

	// Bouton "Annuler" de la modale suppression
	// Remet l'étape 1 quand on ferme la modale pour la prochaine ouverture
	if (btnDeleteCancel) {
		btnDeleteCancel.addEventListener('click', () => {
			// Remet l'étape 1 visible pour la prochaine ouverture
      if (deleteStep1) deleteStep1.classList.remove('d-none');
      if (deleteStep2) deleteStep2.classList.add('d-none');
      if (btnDeleteContinue) btnDeleteContinue.classList.remove('d-none');
      if (btnDeleteConfirm) btnDeleteConfirm.classList.add('d-none');
    });
  }

  /* ===============================
      INITIALISATION
        - Charge les données du menu depuis l'API
     =============================== */

  if (DebugConsole) console.log("=== INITIALISATION PAGE DETAIL MENU ===");
  loadMenuDetail();
}