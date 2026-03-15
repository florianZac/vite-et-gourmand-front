import { API_URL } from './config.js';

/* ===============================
   GESTION DES COOKIES et ROLE
	=============================== */

// Nom du cookie pour le token d'accès
const tokenCookieName = "accesstoken";

// Nom du cookie pour le rôle de l'utilisateur
const roleCookieName = "role";

// Variable debug console si à true
let DebugConsole = false;

/* ===============================
   Configuration API
   =============================== */

//récupere les informations de l'utilisateur concerné
const apiAccountMeUrl = `${API_URL}/api/me`;

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

  if (DebugConsole) {
    console.log("=== DEBUG INIT ===");
    console.log("Cookies actuels :", document.cookie);
    console.log("Token actuel :", getToken());
    console.log("Rôle actuel :", getRole());
    console.log("Éléments data-show présents :", document.querySelectorAll('[data-show]'));
    console.log("=================");
  }

});

/* ===============================
	 Gestion du token
	=============================== */

// Fonction pour sauvegarder le token dans un cookie
export function setToken(token){
  return setCookie(tokenCookieName, token, 7); // 7 jours de validité
}

// Fonction pour récupérer le token depuis le cookie
export function getToken(){
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
    date.setTime(date.getTime() + days*24*60*60*1000); // conversion jours en ms
    expires = "; expires=" + date.toUTCString(); // format UTC
  }
  // Toujours définir path=/ pour éviter les cookies fantômes
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
  if (DebugConsole) console.log(`Cookie défini : ${name}=${value}, expires=${expires}`);
}

// Fonction pour supprimer un cookie
export function eraseCookie(name) {
  // Supprime toutes les variantes possibles de path
  const paths = ["/", "/Pages/Auth", "/script"];
  for (const path of paths) {
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
  if (DebugConsole) console.log(`Cookie supprimé : ${name}`);
}

/* ===============================
	 Permet d'éviter les attaque XSS en échappant les balises HTML
	=============================== */
function sanitizeHtml(text){
  // Créez un élément HTML temporaire de type "div"
  const tempHtml = document.createElement('div');
  
  // Affectez le texte reçu en tant que contenu texte de l'élément "tempHtml"
  tempHtml.textContent = text;
  
  // Utilisez .innerHTML pour récupérer le contenu de "tempHtml"
  // Cela va "neutraliser" ou "échapper" tout code HTML potentiellement malveillant
  return tempHtml.innerHTML;
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
        case 'ROLE_ADMIN':
            if(!userConnected || role !== "ROLE_ADMIN"){
                element.classList.add("d-none");    
            }  
            break;
        case 'ROLE_CLIENT':
            if(!userConnected || role !== "ROLE_CLIENT"){
                element.classList.add("d-none");  
            }
            break;
        case 'ROLE_EMPLOYE':     
            if(!userConnected || role !== "ROLE_EMPLOYE"){
                element.classList.add("d-none"); 
            }  
            break;
      }
  }
  if (DebugConsole) {
    console.log("=== DEBUG NAVBAR ===");
    console.log("Utilisateur connecté ?", userConnected);
    console.log("Rôle actuel :", role);
    console.log("Éléments visibles après traitement :", [...allElements].map(el => ({
      dataset: el.dataset.show,
      visible: !el.classList.contains("d-none")
    })));
    console.log("===================");
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

  if (DebugConsole) console.log("Utilisateur déconnecté, cookies nettoyés.");
}


/* ===============================
	 Récupération des infos utilisateur
	=============================== */
export async function getInfosUser() {
    const token = getToken();

    // Si pas de token, on met à jour la navbar et on quitte
    if (!token) {
        showAndHideElementsForRole();
        if (DebugConsole) console.log("Pas de token trouvé, utilisateur non connecté.");
        return;
    }

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    if (DebugConsole) console.log("=== DEBUG HEADERS ===", {
      "Authorization": `Bearer ${token}`,
    });

    try {
      // Prépare les headers pour la requête API
      // Requête pour récupérer les infos utilisateur
      const response = await fetch(apiAccountMeUrl, {
          method: "GET",
          //headers: { "Authorization": `Bearer ${token}` },
          headers: headers,
          redirect: "follow"
      });

      if (!response.ok) {
          // Si le token est invalide, déconnexion automatique
          if (response.status === 401 || response.status === 403) {
              signout();
          }
          throw new Error(`Erreur API (${response.status})`);
      }
      // Convertit la réponse en JSON
      const user = await response.json();

      // Si l'utilisateur a un rôle, on le stocke dans le cookie
      if (user && user.utilisateur && user.utilisateur.role) {
        setCookie(roleCookieName, user.utilisateur.role, 7);
        // Affiche le prénom dans le bouton utilisateur du header
        const btnUser = document.getElementById('btn-user');
        if (btnUser && user.utilisateur) {
          const prenom = user.utilisateur.prenom || user.utilisateur.email || 'Mon compte';
          btnUser.innerHTML = `<i class="bi bi-person"></i> ${prenom}`;
        }
        
      }
      // Met à jour la navbar selon le rôle
      showAndHideElementsForRole();
      if (DebugConsole) {
        console.log("=== DEBUG UTILISATEUR ===");
        console.log("Infos utilisateur récupérées :", user);
        console.log("Token :", token);
        console.log("Rôle stocké :", getRole());
        console.log("=========================");
      }
    } catch (error) {
        // Affiche les erreurs
        console.error("Erreur Lors de la récuperation des infos utilisateurs:", error);
    }
}
