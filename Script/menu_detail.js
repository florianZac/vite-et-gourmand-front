export function initDetailMenuPage() {

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

	const BASE_URL = 'http://127.0.0.1:8000/api';

	/* ===============================
		 RÉCUPÉRATION DE L'ID DU MENU DEPUIS L'URL
			- 1.	L'URL est de la forme /menu/3
			- 2.	On extrait le dernier segment pour avoir l'ID
		 =============================== */

	// Découpe l'URL en segments et récupère le dernier
	// Exemple : "/menu/3" -> ["", "menu", "3"] -> "3"
	const pathSegments = window.location.pathname.split('/');
	const menuId = pathSegments[pathSegments.length - 1];

	// Si pas d'ID valide, on ne peut rien charger
	if (!menuId || isNaN(menuId)) {
		console.error('ID de menu invalide:', menuId);
		return;
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
	const editPhotoDescription = document.getElementById('edit-photo-description');
	const editPhotoPreviewImg = document.getElementById('edit-photo-preview-img');
	const btnSavePhoto = document.getElementById('btn-save-photo');

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

	// Tableau des photos du menu
	let photos = [];

	// Index de la photo actuellement affichée en grand
	let currentPhotoIndex = 0;

	/* ===============================
		 FONCTION : CHARGER LES DONNÉES DU MENU DEPUIS L'API
			-	1.	Appelle GET /api/menus/{id}
			- 2.	Remplit tous les éléments du DOM
		 =============================== */

	async function loadMenuDetail() {
		try {
			const response = await fetch(`${BASE_URL}/menus/${menuId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				console.error('Erreur chargement détail menu:', response.status);
				return;
			}

			const menu = await response.json();
			console.log('✓ Détail menu chargé:', menu);

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
			console.error('Erreur réseau chargement détail menu:', err);
		}
	}

	/* ===============================
		FONCTION : BREADCRUMB
			- 1.	Affiche le nom du menu dans le fil d'ariane
		=============================== */

	function renderBreadcrumb(menu) {
		if (breadcrumbName) {
			breadcrumbName.textContent = menu.name || '—';
		}
	}

	/* ===============================
		 FONCTION : BADGES (thème + régime + statut)
			- 1.	Thème : badge terracotta
			- 2.	Régime : badge gris avec icône
			- 3.	Statut : vert si disponible, rouge si indisponible
		=============================== */

	function renderBadges(menu) {
		if (!detailBadges) return;

		detailBadges.innerHTML = '';

		// Badge thème
		if (menu.theme) {
			detailBadges.innerHTML += `<span class="detail_menu-badge-theme">${menu.theme}</span>`;
		}

		// Badge régime (avec une icône avant le texte)
		if (menu.regime) {
			detailBadges.innerHTML += `<span class="detail_menu-badge-regime">🍽 ${menu.regime}</span>`;
		}

		// Badge statut (booléen isAvailable du back)
		if (menu.isAvailable) {
			detailBadges.innerHTML += `<span class="detail_menu-badge-available"><i class="bi bi-check"></i> Disponible à la commande</span>`;
		} else {
			detailBadges.innerHTML += `<span class="detail_menu-badge-unavailable"><i class="bi bi-x"></i> Indisponible</span>`;
		}
	}

	/* ===============================
			FONCTION : INFOS PRINCIPALES (titre + description)
		 =============================== */

	function renderMainInfo(menu) {
		if (detailTitle) detailTitle.textContent = menu.name || '—';
		if (detailDescription) detailDescription.textContent = menu.description || '';
	}

	/* ===============================
			FONCTION : TAGS (ingrédients principaux)
		 =============================== */

	function renderTags(menu) {
		if (!detailTags) return;

		detailTags.innerHTML = '';

		const tags = menu.tags || [];
		tags.forEach(tag => {
			detailTags.innerHTML += `<span class="detail_menu-tag">${tag}</span>`;
		});
	}

	/* ===============================
		 FONCTION : CARD PRIX
			- 1.	Prix par personne
			- 2.	Minimum de personnes
			- 3.	Texte de réduction dynamique depuis le back
		=============================== */

	function renderPriceCard(menu) {
		if (detailPrice) detailPrice.textContent = menu.price || 0;
		if (detailMinPersons) detailMinPersons.textContent = menu.minPersons || 0;

		// Texte de réduction (ex: "Réduction de 10% à partir de 5 personnes supplémentaires")
		if (detailReduction) {
			if (menu.reductionText) {
				detailReduction.innerHTML = `<i class="bi bi-tag"></i> ${menu.reductionText}`;
				detailReduction.style.display = 'block';
			} else {
				// Pas de réduction -> on cache la ligne
				detailReduction.style.display = 'none';
			}
		}
	}

	/* ===============================
		 FONCTION : CONDITIONS DU MENU
		  - 1.	Texte dynamique basé sur le nombre min de personnes
			- 2.	Toujours : délai de réservation + acompte
		=============================== */

	function renderConditions(menu) {
		if (!detailConditions) return;

		const minPersons = menu.minPersons || 0;

		// Construit le texte des conditions dynamiquement
		detailConditions.textContent =
			`Commande minimum ${minPersons} personnes. ` +
			`Réservation au moins 7 jours avant la prestation. ` +
			`Accomptes de 30% à la commande.`;
	}

	/* ===============================
		 FONCTION : GALERIE PHOTOS
		  - 1.	Affiche la première photo en grand
		  - 2.	Génère les miniatures cliquables
		  - 3.	Gère les flèches prev/next
		=============================== */

	function renderGallery(menu) {
		// Récupère les photos du menu (tableau d'URLs)
		// Adapte selon la structure de ton API
		photos = menu.photos || menu.images || [];

		// Si pas de photos, affiche un placeholder
		if (photos.length === 0) {
			if (galleryMainImg) {
				galleryMainImg.src = '/Assets/Images/placeholder-menu.jpg';
				galleryMainImg.alt = menu.name || 'Menu';
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
		if (!galleryMainImg || photos.length === 0) return;

		// Met à jour la source et le texte alt de l'image principale
		galleryMainImg.src = photos[currentPhotoIndex];
		galleryMainImg.alt = `Photo ${currentPhotoIndex + 1}`;

		// Affiche ou cache les boutons admin/employé sur la photo principale
		// Les boutons sont cachés par défaut (d-none dans le HTML)
		// On les affiche uniquement si le token JWT contient ROLE_ADMIN ou ROLE_EMPLOYE
		const actionButtons = document.getElementById('action-image-buttons');
		if (actionButtons) {
			// Vérifie si l'utilisateur a le rôle admin ou employé
			const token = localStorage.getItem('token');
			if (token) {
				try {
					// Décode le payload du JWT pour lire les rôles
					const payload = JSON.parse(atob(token.split('.')[1]));
					const roles = payload.roles || [];

					// Si admin ou employé → retire d-none pour afficher la div
					if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_EMPLOYE')) {
						actionButtons.classList.remove('d-none');
					} else {
						// Client ou visiteur → garde la div cachée
						actionButtons.classList.add('d-none');
					}
				} catch (err) {
					// Token invalide → cache les boutons par sécurité
					actionButtons.classList.add('d-none');
				}
			} else {
				// Pas de token (non connecté) → cache les boutons
				actionButtons.classList.add('d-none');
			}
		}

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
		  - 1.	Crée une miniature pour chaque photo (max 3)
		  - 2.	Au clic sur une miniature la photo cliquée devient la photo principale
		 =============================== */

	function renderThumbnails() {
		if (!galleryThumbs) return;

		galleryThumbs.innerHTML = '';

		// Maximum 3 photos
		const maxPhotos = Math.min(photos.length, 3);

		for (let i = 0; i < maxPhotos; i++) {
			const thumb = document.createElement('div');
			thumb.className = `detail_menu-gallery-thumb ${i === currentPhotoIndex ? 'active' : ''}`;
			thumb.innerHTML = `<img src="${photos[i]}" alt="Photo ${i + 1}">`;

			// Au clic cette photo devient la photo principale
			thumb.addEventListener('click', () => {
				currentPhotoIndex = i;
				updateMainPhoto();
			});

			galleryThumbs.appendChild(thumb);
		}
	}

	/* ===============================
		 LISTENERS : FLÈCHES DE NAVIGATION GALERIE
		 =============================== */

	// Flèche précédente
	if (galleryPrev) {
		galleryPrev.addEventListener('click', () => {
			if (photos.length === 0) return;
			// Si on est à la première photo, on boucle vers la dernière
			currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
			updateMainPhoto();
		});
	}

	// Flèche suivante
	if (galleryNext) {
		galleryNext.addEventListener('click', () => {
			if (photos.length === 0) return;
			// Si on est à la dernière photo, on boucle vers la première
			currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
			updateMainPhoto();
		});
	}

	/* ===============================
		 SECTION 7 : MODALE ÉDITION PHOTO (EditionPhotoModal)
		  - Quand la modale s'ouvre : pré-remplit la prévisualisation avec la photo actuelle
		  - L'utilisateur peut :
		 		1. Sélectionner une nouvelle image (prévisualisation en temps réel)
				2. Saisir un titre (utilisé pour le champ alt de l'image)
				3. Saisir une description (méta-donnée stockée en BDD)
		  - Au clic sur "Sauvegarder" → envoie le tout à l'API en POST (FormData)
		  - Endpoint API : POST /api/menus/{id}/photos/{index}
		 =============================== */

	// ÉVÉNEMENT : Quand la modale édition s'ouvre
	// Pré-remplit la prévisualisation avec la photo actuellement affichée en grand
	const editionModal = document.getElementById('EditionPhotoModal');
	if (editionModal) {
		editionModal.addEventListener('show.bs.modal', () => {
			// Affiche la photo actuelle dans la prévisualisation de la modale
			if (editPhotoPreviewImg && photos[currentPhotoIndex]) {
				editPhotoPreviewImg.src = photos[currentPhotoIndex];
			}
			// Réinitialise les champs du formulaire à chaque ouverture
			if (editPhotoFile) editPhotoFile.value = '';
			if (editPhotoTitle) editPhotoTitle.value = '';
			if (editPhotoDescription) editPhotoDescription.value = '';
		});
	}

	// LISTENER : Prévisualisation en temps réel quand l'utilisateur sélectionne un fichier
	// Utilise FileReader pour lire le fichier image et l'afficher dans l'aperçu
	if (editPhotoFile) {
		editPhotoFile.addEventListener('change', () => {
			// Récupère le fichier sélectionné
			const file = editPhotoFile.files[0];
			if (!file) return;

			// Crée un FileReader pour lire le fichier en base64
			// Cela permet d'afficher l'image dans la modale AVANT l'envoi à l'API
			const reader = new FileReader();

			// Quand la lecture est terminée → met à jour l'aperçu
			reader.onload = (e) => {
				if (editPhotoPreviewImg) {
					editPhotoPreviewImg.src = e.target.result;
				}
			};

			// Lance la lecture du fichier en Data URL (base64)
			reader.readAsDataURL(file);
		});
	}

	// LISTENER : Bouton "Sauvegarder" dans la modale édition
	// Envoie le fichier + titre + description à l'API
	if (btnSavePhoto) {
		btnSavePhoto.addEventListener('click', async () => {
			// Récupère le fichier sélectionné
			const file = editPhotoFile?.files[0];

			// Récupère le titre (obligatoire)
			const title = editPhotoTitle?.value?.trim() || '';

			// Récupère la description (optionnelle)
			const description = editPhotoDescription?.value?.trim() || '';

			// Validation : vérifie qu'un fichier et un titre sont remplis
			if (!file) {
				alert('Veuillez sélectionner une image.');
				return;
			}
			if (!title) {
				alert('Veuillez saisir un titre pour l\'image.');
				return;
			}

			// Récupère le token JWT pour l'authentification
			const token = localStorage.getItem('token');
			if (!token) return;

			// Index de la photo à remplacer (celle affichée en grand)
			const photoIndex = currentPhotoIndex;

			// Crée un FormData pour envoyer le fichier + les métadonnées
			// FormData gère automatiquement le Content-Type multipart/form-data
			const formData = new FormData();
			formData.append('photo', file);              // Le fichier image
			formData.append('title', title);             // Le titre (pour le champ alt)
			formData.append('description', description); // La description
			formData.append('index', photoIndex);        // L'index de la photo à remplacer

			try {
				// Envoie à l'API : POST /api/menus/{menuId}/photos/{photoIndex}
				const response = await fetch(`${BASE_URL}/menus/${menuId}/photos/${photoIndex}`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`
						// Pas de 'Content-Type' → le navigateur le définit
						// automatiquement avec le boundary pour multipart/form-data
					},
					body: formData
				});

				if (response.ok) {
					// L'API retourne la nouvelle URL de la photo
					const data = await response.json();
					console.log('✓ Photo modifiée avec succès');

					// Met à jour l'URL de la photo dans le tableau local
					if (data.photoUrl) {
						photos[photoIndex] = data.photoUrl;
					}

					// Rafraîchit l'affichage de la galerie
					updateMainPhoto();
					renderThumbnails();

					// Ferme la modale via Bootstrap
					const modalInstance = bootstrap.Modal.getInstance(editionModal);
					if (modalInstance) modalInstance.hide();

				} else {
					const error = await response.json();
					console.error('Erreur modification photo:', error.message || error);
					alert('Erreur lors de la sauvegarde de la photo.');
				}

			} catch (err) {
				console.error('Erreur réseau modification photo:', err);
				alert('Erreur réseau, veuillez réessayer.');
			}
		});
	}

	/* ===============================
		 SECTION 8 : MODALE SUPPRESSION PHOTO (SuppresionPhotoModal)
		 	- Double vérification en 2 étapes :
				Étape 1 : Aperçu de la photo + message d'avertissement + bouton "Continuer"
				Étape 2 : L'utilisateur doit taper "SUPPRIMER" pour activer le bouton final
		 	- Au clic sur "Supprimer définitivement" → envoie DELETE à l'API
		 	- Endpoint API : DELETE /api/menus/{id}/photos/{index}
		 	- Protection : impossible de supprimer la dernière photo
		 =============================== */

	// ÉVÉNEMENT : Quand la modale suppression s'ouvre
	// Remet toujours l'étape 1 visible et l'étape 2 cachée
	const suppressionModal = document.getElementById('SuppresionPhotoModal');
	if (suppressionModal) {
		suppressionModal.addEventListener('show.bs.modal', () => {
			// Affiche la photo actuelle dans l'aperçu de suppression
			if (deletePhotoPreviewImg && photos[currentPhotoIndex]) {
				deletePhotoPreviewImg.src = photos[currentPhotoIndex];
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

	// LISTENER : Bouton "Continuer" (étape 1 vers étape 2)
	// Vérifie qu'il reste plus d'une photo, puis affiche l'étape 2
	if (btnDeleteContinue) {
		btnDeleteContinue.addEventListener('click', () => {
			// Vérifie qu'il reste plus d'une photo
			if (photos.length <= 1) {
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

	// LISTENER : Champ de saisie "SUPPRIMER" (étape 2)
	// Active ou désactive le bouton "Supprimer définitivement" en temps réel
	if (deleteConfirmInput) {
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

	// LISTENER : Bouton "Supprimer définitivement" (étape 2)
	// Envoie le DELETE à l'API puis ferme la modale
	if (btnDeleteConfirm) {
		btnDeleteConfirm.addEventListener('click', async () => {
			// Double vérification : vérifie encore une fois que le texte est correct
			const value = deleteConfirmInput?.value?.trim().toUpperCase();
			if (value !== 'SUPPRIMER') {
				// Affiche le message d'erreur
				if (deleteConfirmError) deleteConfirmError.classList.remove('d-none');
				return;
			}

			// Récupère le token JWT pour l'authentification
			const token = localStorage.getItem('token');
			if (!token) return;

			// Index de la photo à supprimer
			const photoIndex = currentPhotoIndex;

			try {
				// Envoie DELETE à l'API : DELETE /api/menus/{menuId}/photos/{photoIndex}
				const response = await fetch(`${BASE_URL}/menus/${menuId}/photos/${photoIndex}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				});

				if (response.ok) {
					console.log('✓ Photo supprimée avec succès');

					// Retire la photo du tableau local avec splice
					photos.splice(photoIndex, 1);

					// Si l'index actuel dépasse le nouveau tableau après suppression,
					// on revient à la dernière photo disponible
					if (currentPhotoIndex >= photos.length) {
						currentPhotoIndex = photos.length - 1;
					}

					// Rafraîchit l'affichage
					updateMainPhoto();
					renderThumbnails();

					// Ferme la modale via Bootstrap
					const modalInstance = bootstrap.Modal.getInstance(suppressionModal);
					if (modalInstance) modalInstance.hide();

				} else {
					const error = await response.json();
					console.error('Erreur suppression photo:', error.message || error);
					alert('Erreur lors de la suppression de la photo.');
				}

			} catch (err) {
				console.error('Erreur réseau suppression photo:', err);
				alert('Erreur réseau, veuillez réessayer.');
			}
		});
	}

	// LISTENER : Bouton "Annuler" de la modale suppression
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
		 FONCTION : COMPOSITION DU MENU
			- 1.	3 cards : Entrée, Plat, Dessert
			- 2.	Chaque card a : icône +  titre, description, allergènes
			- 3.	Si allergènes vide mettre un badge avec le texte "Aucun"
		 =============================== */

	function renderComposition(menu) {
		if (!compositionGrid) return;

		compositionGrid.innerHTML = '';

		// Configuration statique des 3 types de plats
		// Icône Bootstrap + label + la clé correspondante dans l'objet menu
		const dishes = [
			{ icon: '<i class="bi bi-egg-fried"></i>', label: 'ENTRÉE', key: 'entree' },
			{ icon: '<i class="bi bi-cup-hot"></i>', label: 'PLAT', key: 'plat' },
			{ icon: '<i class="bi bi-cake2"></i>', label: 'DESSERT', key: 'dessert' }
		];

		dishes.forEach(dish => {
			// Récupère les données du plat depuis l'objet menu
			// Adapte les clés selon la structure de ton API
			const dishData = menu[dish.key] || {};

			// Génère les badges allergènes
			const allergens = dishData.allergens || [];
			let allergensHtml = '';

			if (allergens.length === 0) {
				// Pas d'allergènes -> badge vert "Aucun"
				allergensHtml = '<span class="detail_menu-dish-allergen-none">Aucun</span>';
			} else {
				// Un badge par allergène
				allergensHtml = allergens
					.map(a => `<span class="detail_menu-dish-allergen-badge">${a}</span>`)
					.join('');
			}

			// Crée la colonne Bootstrap + la card
			const col = document.createElement('div');
			col.className = 'col-12 col-lg-4 mb-3';
			col.innerHTML = `
				<div class="detail_menu-dish-card">
					<!-- Type du plat : icône + label statique -->
					<div class="detail_menu-dish-type">
						<span class="detail_menu-dish-type-icon">${dish.icon}</span>
						<span class="detail_menu-dish-type-label">${dish.label}</span>
					</div>

					<!-- Titre du plat -->
					<h3 class="detail_menu-dish-name">${dishData.name || '—'}</h3>

					<!-- Description du plat -->
					<p class="detail_menu-dish-description">${dishData.description || ''}</p>

					<!-- Allergènes -->
					<div class="detail_menu-dish-allergens-label">
						<i class="bi bi-shield-exclamation"></i>
						<span>Allergènes :</span>
					</div>
					<div class="detail_menu-dish-allergens">
						${allergensHtml}
					</div>
				</div>
			`;

			compositionGrid.appendChild(col);
		});
	}

	/* ===============================
		FONCTION : BOUTON COMMANDER
		 - 1.	Si le menu est indisponible -> bouton désactivé
		 - 2.	Si l'utilisateur n'est pas connecté -> redirige vers /login
		 - 3.	Si connecté + rôle ROLE_CLIENT -> redirige vers /commander
		 - 4.	Sinon (employé, admin) -> redirige vers /
		 =============================== */

	function setupOrderButton(menu) {
		if (!btnOrder) return;

		// Si le menu est indisponible, on désactive le bouton
		if (!menu.isAvailable) {
			btnOrder.disabled = true;
			btnOrder.innerHTML = '<i class="bi bi-x-circle"></i> Menu indisponible';
			return;
		}

		btnOrder.addEventListener('click', () => {
			// Vérifie si un token JWT existe (= utilisateur connecté)
			const token = localStorage.getItem('token');

			if (!token) {
				// Pas connecté -> redirige vers la page de connexion
				window.location.href = '/login';
				return;
			}

			// Connecté -> vérifie le rôle dans le token
			try {
				const payload = JSON.parse(atob(token.split('.')[1]));
				const roles = payload.roles || [];

				if (roles.includes('ROLE_CLIENT')) {
					// Client connecté -> page commande
					window.location.href = '/commander';
				} else {
					// Employé ou admin -> pas accès à la commande
					console.log('Accès commande réservé aux clients');
					window.location.href = '/';
				}
			} catch (err) {
				console.error('Erreur décodage token:', err);
				window.location.href = '/login';
			}
		});
	}

	/* ===============================
		 INITIALISATION
		 	- Charge les données du menu depuis l'API
		 =============================== */

	loadMenuDetail();
}