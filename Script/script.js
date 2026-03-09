import { API_URL } from './config.js';

/* ===============================
   GESTION DES COOKIES et ROLE
	=============================== */

// Nom du cookie pour le token d'accès
const tokenCookieName = "accesstoken";

// Nom du cookie pour le rôle de l'utilisateur
const roleCookieName = "role";

/* ===============================
   Configuration API
   =============================== */

const apiAccountMeUrl = `${API_URL}/api/login`;

/* ===============================
   Initialisation globale
	=============================== */

// Au chargement complet du DOM
document.addEventListener("DOMContentLoaded", () => {

    // Sélection du bouton de déconnexion
    const signoutBtn = document.getElementById("signout-btn");

    // Si le bouton existe, on ajoute un listener pour déconnexion
    if (signoutBtn) signoutBtn.addEventListener("click", () => signout());

    // Mise à jour de la navbar selon le rôle actuel
    showAndHideElementsForRole(); 

    // Chargement des informations utilisateur (token + rôle)
    getInfosUser();
});

/* ===============================
	 Gestion du token
	=============================== */

// Fonction pour sauvegarder le token dans un cookie
function setToken(){
    return setCookie(tokenCookieName, token, 7); // 7 jours de validité
}

// Fonction pour récupérer le token depuis le cookie
function getToken(){
    return getCookie(tokenCookieName);
}

/* ===============================
	 Gestion des cookies
	=============================== */

// Fonction pour récupérer la valeur d'un cookie par son nom
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null; // cookie non trouvé
}

// Fonction pour vérifier si l'utilisateur est connecté (token présent)
export function isConnected() {
    return !!getCookie(tokenCookieName);
}

// Fonction pour récupérer le rôle de l'utilisateur depuis le cookie
export function getRole() {
    return getCookie(roleCookieName);
}

// Fonction pour créer ou mettre à jour un cookie
export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days*24*60*60*1000); // conversion jours → ms
        expires = "; expires=" + date.toUTCString(); // format UTC
    }
    // Toujours définir path=/ pour éviter les cookies fantômes
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
}

// Fonction pour supprimer un cookie
export function eraseCookie(name) {
    // Supprime toutes les variantes possibles de path
    const paths = ["/", "/Pages/Auth", "/script"];
    for (const path of paths) {
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
}

/* ===============================
	 Affichage dynamique de la navbar 

	=============================== */

export function showAndHideElementsForRole() {
    // Vérifie si l'utilisateur est connecté
    const userConnected = isConnected();

    // Récupère le rôle actuel
    const role = getRole();

    // Sélectionne tous les éléments ayant l'attribut data-show
    const allElements = document.querySelectorAll('[data-show]');

    // Parcourt chaque élément pour décider de l'afficher ou non
    for (const element of allElements) {
			
        element.classList.remove("d-none"); // réinitialise la visibilité

        // Selon le rôle requis dans data-show
        switch(element.dataset.show) {
            case 'disconnected':
                if(userConnected){
                    element.classList.add("d-none");    
                }  
                break;
            case 'connected':
                if(!userConnected){
                    element.classList.add("d-none");    
                }  
                break;
            case 'admin':
                if(!userConnected || role !== "admin"){
                    element.classList.add("d-none");    
                }  
                break;
            case 'client':
                if(!userConnected || role !== "client"){
                    element.classList.add("d-none");  
                }
                break;
            case 'employee':     
                if(!userConnected || role !== "employee"){
                    element.classList.add("d-none"); 
                }  
                break;
        }
    }
}

/* ===============================
	 Déconnexion
	=============================== */

export function signout() {
    // Supprime les cookies connus
    eraseCookie(tokenCookieName);
    eraseCookie(roleCookieName);

    // Supprime tous les cookies résiduels (par sécurité)
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.slice(0, eqPos).trim() : c.trim();
        if(name) { 
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
    }

    // Met à jour la navbar après déconnexion
    showAndHideElementsForRole();

    // Recharge la page principale du SPA
    globalThis.history.pushState({}, "", "/");
    globalThis.dispatchEvent(new Event('popstate'));
}


/* ===============================
	 Récupération des infos utilisateur
	=============================== */

function getInfosUser() {
    const token = getToken();

    // Si pas de token, on met à jour la navbar et on quitte
    if (!token) {
        showAndHideElementsForRole();
        return;
    }

    // Prépare les headers pour la requête API
    const myHeaders = new Headers();
    myHeaders.append("X-AUTH-TOKEN", token);

    // Requête pour récupérer les infos utilisateur
    fetch(apiAccountMeUrl, {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    })
    .then(async (response) => {
        if (!response.ok) {
            // Si le token est invalide, déconnexion automatique
            if (response.status === 401 || response.status === 403) {
                signout(); 
            }
            throw new Error(`Erreur API (${response.status})`);
        }
        return response.json(); // Convertit la réponse en JSON
    })
    .then((user) => {
        // Si l'utilisateur a un rôle, on le stocke dans le cookie
        if (user && user.role) {
            setCookie(roleCookieName, user.role, 7);
        }
        // Met à jour la navbar selon le rôle
        showAndHideElementsForRole();
    })
    .catch((error) => console.error(error)); // Affiche les erreurs
}