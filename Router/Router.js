// Import de la classe Route qui sert de modèle pour définir une route
import Route from "../Router/Route.js";

// Import de toutes les routes du site + le nom du site
import { allRoutes, websiteName } from "../Router/allRoutes.js";

// Import des fonctions utilitaires :
// - vérifier si un utilisateur est connecté
// - afficher/cacher certains éléments selon le rôle
// - récupérer le rôle de l'utilisateur
import { isConnected, showAndHideElementsForRole, getRole } from "../script/script.js"; 


/* =====================================================
   LOGIQUE DE ROUTAGE SPA (Single Page Application)
   ===================================================== */


// Mode debug - affichera des logs dans la console si égale à True
const debug = true;

// Création d'une route spéciale pour les pages introuvables (404)
const route404 = new Route(
    "404",                          // nom interne de la route
    "Page introuvable",             // titre affiché dans le navigateur
    "/Pages/404.html",              // chemin vers le fichier HTML de la page 404
    "/",                            // URL par défaut de redirection
    ["client","employee","admin"],  // rôles autorisés
    false                           // reload JS
);


// Cache qui mémorise les scripts JS déjà chargés
// Permet d'éviter de recharger plusieurs fois le même fichier JS
const loadedScripts = new Set();

/* =====================================================
   RÉCUPÉRER LA ROUTE CORRESPONDANT À L'URL
   ===================================================== */

const getRouteByUrl = (url) => {

    // Si l'URL est index.html ou vide on la remplace par "/"
    if (url === "/index.html" || url === "") url = "/";

    // Recherche dans la liste des routes celle qui correspond à l'URL
    // Si aucune correspondance → on retourne la route 404
    return allRoutes.find(route => route.url === url) || route404;
};

/* =====================================================
   FORMATTER L'HEURE POUR LES LOGS DEBUG
   ===================================================== */

const getFormattedTime = () => {

    // Récupère la date actuelle
    const now = new Date();

    // Retourne l'heure au format français sans AM/PM
    return now.toLocaleTimeString("fr-FR", { hour12: false });
};

/* =====================================================
   CHARGER LE CONTENU HTML D'UNE PAGE (SPA)
   ===================================================== */

export const LoadContentPage = async () => {

    // Récupère le chemin de l'URL actuelle dans le navigateur
    const path = window.location.pathname;

    // Trouve la route correspondant à cette URL
    const actualRoute = getRouteByUrl(path);

    /* =====================================================
       VÉRIFICATION DES DROITS D'ACCÈS
       ===================================================== */

    // Tableau des rôles autorisés pour la route
    const allRolesArray = actualRoute.authorize;

    // Si des rôles sont définis
    if (allRolesArray.length > 0) {

        // Cas particulier : pages réservées aux utilisateurs NON connectés
        if (allRolesArray.includes("disconnected")) {

            // Si l'utilisateur est déjà connecté
            if (isConnected()) {

                // On le redirige vers l'accueil
                return navigate("/");
            }

        } else {

            // Si la page nécessite une connexion
            if (!isConnected()) {

                // Redirection vers la page login
                return navigate("/login");
            }

            // Récupération du rôle utilisateur (admin ou client)
            const roleUser = getRole();

            // Si le rôle n'est pas autorisé pour cette page
            if (!allRolesArray.includes(roleUser)) {

                // Redirection vers l'accueil
                return navigate("/");
            }
        }
    }


    /* =====================================================
       CHARGEMENT DU HTML DE LA PAGE
       ===================================================== */

    try {

        // Requête HTTP pour récupérer le fichier HTML
        const res = await fetch(actualRoute.pathHtml);

        // Si erreur HTTP
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        // Conversion de la réponse en texte HTML
        const html = await res.text();

        // Injection du HTML dans la div principale
        document.getElementById("main-page").innerHTML = html;

    } catch (err) {

        // Affiche l'erreur dans la console
        console.error("Erreur chargement page :", err);

        // Affiche un message d'erreur dans la page
        document.getElementById("main-page").innerHTML = "<h2>Erreur chargement</h2>";
    }


    /* =====================================================
       INITIALISATION DES MODALS BOOTSTRAP
       ===================================================== */

    // Recherche tous les modals présents dans la page injectée
    document.querySelectorAll('#main-page .modal').forEach(modalEl => {

        // Initialisation du modal avec Bootstrap
        new bootstrap.Modal(modalEl);
    });


    /* =====================================================
       CHARGEMENT DU JS SPÉCIFIQUE À LA PAGE
       ===================================================== */

    if (actualRoute.pathJS && actualRoute.pathJS.trim() !== "") {

        // Fonction qui importe dynamiquement le module JS
        const loadScript = () => {

            import(
                actualRoute.pathJS + 
                (actualRoute.reloadJS ? `?v=${Date.now()}` : "")
            )

            .then(mod => {

                // Si la fonction initLoginPage existe dans le module
                if (mod.initLoginPage) mod.initLoginPage();
            })

            .catch(err => console.error("Erreur import module JS:", err));
        };

        // Si le script doit être rechargé ou s'il n'a jamais été chargé
        if (actualRoute.reloadJS || !loadedScripts.has(actualRoute.pathJS)) {

            loadScript();

            // On ajoute le script au cache
            if (!actualRoute.reloadJS) loadedScripts.add(actualRoute.pathJS);

        } else {

            // Sinon on recharge quand même le script
            loadScript();
        }
    }


    /* =====================================================
       MISE À JOUR DU TITRE DE LA PAGE
       ===================================================== */

    document.title = `${actualRoute.title} - ${websiteName}`;


    /* =====================================================
       LOG DEBUG
       ===================================================== */

    if (debug)
        console.log(`[SPA Router] Navigué vers ${path} à ${getFormattedTime()}`);


    /* =====================================================
       MISE À JOUR DE LA NAVBAR SELON LE RÔLE
       ===================================================== */

    if (typeof showAndHideElementsForRole === "function") {

        // Affiche ou cache les éléments admin/client
        showAndHideElementsForRole();
    }
};

/* =====================================================
   NAVIGATION SPA
   ===================================================== */

export const navigate = (url) => {

    // Change l'URL dans la barre du navigateur sans recharger la page
    window.history.pushState({}, "", url);

    // Recharge le contenu correspondant à la nouvelle route
    LoadContentPage();
};

/* =====================================================
   INTERCEPTION DES CLICS SUR LES LIENS INTERNES
   ===================================================== */
// Event delegation pour les liens internes SPA
document.addEventListener("click", (event) => {

    // Cherche si on a cliqué sur un lien interne
    const link = event.target.closest('a[href^="/"]');

    // Si ce n'est pas un lien interne → on ignore
    if (!link) return;

    // Empêche le comportement normal du lien
    event.preventDefault();

    // Navigation SPA
    navigate(link.getAttribute("href"));
});


/* =====================================================
   GESTION DU BOUTON RETOUR / AVANT DU NAVIGATEUR
   ===================================================== */

// Lorsque l'utilisateur clique sur retour ou avance
window.onpopstate = LoadContentPage;

// Charge la page correspondant à l'URL actuelle
LoadContentPage();
