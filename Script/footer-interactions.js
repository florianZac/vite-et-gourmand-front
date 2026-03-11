import { API_URL } from './config.js';

// URL de base de l'API Symfony pour récupérer les horaires
const apiHoraire = `${API_URL}/api/horaires`;

// Variable debug console si à true
let DebugConsole = false;

/**
 * Fonction principale pour injecter dynamiquement les horaires dans le footer
 */
export async function initFooterInteractions() {

  // Sélection de la colonne des horaires dans le footer
  const horairesCol = document.querySelector('.footer-dark .col-lg-4:nth-child(2)');

  // Si la colonne n'existe pas, on arrête la fonction et on log un warning
  if (!horairesCol) {
    if (DebugConsole) console.warn("Colonne horaires non trouvée dans le footer.");
    return;
  }
  if (DebugConsole) console.log("Script footer-interactions chargé !");

  // On vide le contenu actuel pour ne garder que le titre
  horairesCol.innerHTML = `<h5><i class="bi bi-clock icon-orange"></i> Horaires d'ouverture</h5>`;

  try {
    // Appel de l'API pour récupérer les horaires
    const response = await fetch(apiHoraire);
    // Si la réponse HTTP n'est pas OK, on déclenche une erreur
    if (!response.ok) throw new Error(`Impossible de récupérer les horaires (status ${response.status})`);
    // On parse la réponse JSON
    const horaires = await response.json();

    if (DebugConsole) console.log("Horaires récupérés depuis l'API :", horaires);
    // Pour chaque jour, on crée une ligne d'affichage
    horaires.forEach(horaire => {
      const row = document.createElement('div');
      row.className = 'hours-row';

      // Gestion du "Fermé" si l'heure d'ouverture ou de fermeture est null ou invalide
      let displayHeures;
      if (!horaire.heureOuverture || !horaire.heureFermeture || horaire.heureOuverture === 'Fermé' || horaire.heureFermeture === 'Fermé') {
        displayHeures = 'Fermé';
      } else {
        displayHeures = `${horaire.heureOuverture} – ${horaire.heureFermeture}`;
      }
      // Injection du HTML de la ligne
      row.innerHTML = `<span>${horaire.jour}</span><span>${displayHeures}</span>`;
      // Ajout de la ligne dans la colonne
      horairesCol.appendChild(row);
      // Affichage du débug si égal à true 
      if (DebugConsole) console.log(`Horaire ajouté : ${horaire.jour} => ${displayHeures}`);
    });
  
  // Gestion des erreurs : problème réseau ou parsing JSON
  } catch (err) {
    console.error('Erreur récupération horaires :', err);
    // Affiche un message par défaut dans le footer
    const errorRow = document.createElement('div');
    errorRow.className = 'hours-row';
    errorRow.innerHTML = `<span colspan="2">Horaires indisponibles</span>`;
    horairesCol.appendChild(errorRow);
  }
}

// Initialisation automatique si le fichier est importé
initFooterInteractions();