import { API_URL } from '../config.js';
import { getToken} from '../script.js';
export function initCompteAdminPage() {

  /* ===============================
      SCRIPT PAGE ADMIN STATISTIQUE
     =============================== */
  
  // Variable debug console 
  let DebugConsole = false;

  /* ===============================
      CONFIGURATION API
     =============================== */

  // EndPoint de l'API pour la récupération des infos de l'utilisateur
  const apiMeUrl = `${API_URL}/api/me`;

  // EndPoint de l'API pour la récupération et la génération des statistiques
  const apiStats = `${API_URL}/api/admin/statistiques`;

  // EndPoint de l'API pour la génération des fraphique avec chart JS
  const apiGraphiques = `${API_URL}/api/admin/statistiques/graphiques`;

  if (DebugConsole) {
    console.log("=== DEBUG CONFIG API ===");
    console.log("API_URL       :", API_URL);
    console.log("apiMeUrl      :", apiMeUrl);
    console.log("apiStats      :", apiStats);
    console.log("apiGraphiques :", apiGraphiques);
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
  // Headers pour toutes les requêtes authentifiées
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

  const statsList = document.getElementById('statistiques-list');

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
      FONCTION : CREATION CARD STAT PARAMETRABLE
     =============================== */
  function createStatCard(icon, value, label, color) {
    return `
      <div class="stat-card">
        <div class="stat-icon" style="color:${color}">
          <i class="bi ${icon}"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value" style="color:${color}">
            ${value}
          </div>
          <div class="stat-label">
            ${label}
          </div>
        </div>
      </div>
    `;
  }
  
  /* ===============================
      FONCTION : AFFICHER LES STATS
     =============================== */
  function renderStats(s) {
    if (!statsList) return;

    const ca = s.chiffre_affaires_total || s.ca_total || 0;
    const totalCmd = s.total_commandes || 0;
    const revenuMoyen = totalCmd > 0 ? (ca / totalCmd).toFixed(2) : 0;
    const totalRembourse = s.total_rembourse || 0;

    // Top 3 des menus des menus
    const topMenus = s.top_menus || [];
    let topMenusHtml = '';
    if (topMenus.length > 0) {
      topMenusHtml = topMenus.slice(0, 3).map(function(m, i) {
        const trophyClass = ['gold', 'silver', 'bronze'][i] || '';
        return `
          <div class="top-menu-item">
            <i class="bi bi-trophy ${trophyClass}"></i>
            <div>
              <div class="top-menu-title-${trophyClass}">${m.titre || m.menu}</div>
              <div class="top-menu-count">
                <span class="count-value">${m.total || m.nombre_commandes || 0}</span>
                <span class="count-label-${trophyClass}">commandes</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } 

    // Utilisateurs
    const u = s.utilisateurs || {};
    // Avis
    const a = s.avis || {};

    statsList.innerHTML = `
      ${createStatCard('bi-graph-up-arrow', ca.toLocaleString('fr-FR') + ' €', 'Chiffre d\'affaires Total', '#c8956c')}
      ${createStatCard('bi bi-wallet-fill', totalCmd, 'Commandes Totales', '#5a4a3a')}
      ${createStatCard('bi-currency-euro', revenuMoyen + ' €', 'Revenu moyen / commande', '#396a24')}
      ${createStatCard('bi bi-coin', totalRembourse.toLocaleString('fr-FR') + ' €', 'Total remboursé', '#c0392b')}

      <div class="p-3 mb-2 rounded card-top">
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="bi bi-trophy icone" ></i>
          <strong class="title-top">Top 3 des menus les plus commandés</strong>
        </div>
        ${topMenusHtml || '<small class="text-muted ms-4">Aucune donnée</small>'}
      </div>

      <div class="p-3 mb-2 rounded stat-user" ">
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="bi bi-people icon-user" ></i>
          <strong class="title-top">Statistiques utilisateurs</strong>
        </div>
        <small class="ms-4 content-user">
          Total Utilisateur : <strong class="label">${u.total || 0}</strong><br>
          Total Utilisateur actif : <strong class="label-active">${u.actifs || 0}</strong><br>
          Total Utilisateur Inactifs : <strong class="label-warning">${u.inactifs || 0}</strong><br>
          Demande de désactivation : <strong class="label-inactive">${u.en_attente || 0}</strong>
        </small>
      </div>

      <div class="p-3 mb-2 rounded stat-avis">
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="bi bi-star-half icon-avis"></i>
          <strong class="title-top">Statistiques Avis</strong>
        </div>
        <small class="ms-4 content-avis">
          Total Avis : <strong class="label">${a.total || 0}</strong><br>
          Total Avis En attente actif : <strong class="label-inactive ">${a.en_attente || 0}</strong><br>
          Total Avis Validés : <strong class="label-active">${a.valides || 0}</strong><br>
          Total Avis Refusés : <strong class="label-warning">${a.refuses || 0}</strong>
        </small>
      </div>
    `;
  }

  /* ===============================
      FONCTION : CHARGEMENT DES STATS
        - Appel GET /api/admin/statistiques
     =============================== */
  async function loadStatistiques() {
    if (DebugConsole) console.log("[loadStatistiques] Appel GET", apiStats);

    try {
      const response = await fetch(apiStats, { method: 'GET', headers: authHeaders });
      if (!response.ok) {
        console.error("[loadStatistiques] Erreur :", response.status);
        return;
      }
      let result = {};
      try { result = await response.json(); } catch { result = {}; }

      const s = result.statistiques || {};
      if (DebugConsole) console.log("[loadStatistiques] Données :", s);

      renderStats(s);
    } catch (err) {
      console.error('[loadStatistiques] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : CHARGER LES GRAPHIQUES MongoDB
        - Appel GET /api/admin/statistiques/graphiques
     =============================== */
  async function loadGraphiques() {
    if (DebugConsole) console.log("[loadGraphiques] Appel GET", apiGraphiques);

    try {
      const response = await fetch(apiGraphiques, { method: 'GET', headers: authHeaders });
      if (!response.ok) {
        console.error("[loadGraphiques] Erreur :", response.status);
        return;
      }
      let result = {};
      try { result = await response.json(); } catch { result = {}; }

      const g = result.graphiques || {};
      if (DebugConsole) console.log("[loadGraphiques] Données :", g);

      renderCharts(g);
    } catch (err) {
      console.error('[loadGraphiques] Erreur :', err);
    }
  }

  /* ===============================
      FONCTION : AFFICHER LES GRAPHIQUES
     =============================== */
  function renderCharts(g) {
    if (DebugConsole) console.log("[renderCharts] Appel renderCharts ");
    
    // Charger les données stats pour le pie chart des statuts
    loadStatutsPieChart();

    /*
    * ------- GRAPHIQUE : CA par mois -------- 
    */
    const caParMois = g.ca_par_mois || [];
    if (DebugConsole) console.log("[renderCharts] Data recut : ",caParMois);

    const ctxMois = document.getElementById('chart-mois');

    // Vérification des données
    if (ctxMois && caParMois.length > 0) {

      // Création du graphique
      const graphiqueCAParMois = new Chart(ctxMois, {
        // Type de graphique : barre
        type: 'bar', 
        data: {
          // Mise en place des labels
          labels: caParMois.map(function(element) {
            return element.mois;
          }),
          datasets: [
            {
              // Valeurs du chiffre d'affaires
              label: 'CA (€)', 
              data: caParMois.map(function(element) {
                // Valeurs du chiffre d'affaires
                return element.ca_total; 
              }),
              // Couleur des barres
              backgroundColor: '#c8956c', 
              // Arrondi des barres 
              borderRadius: 4 
            }
          ]
        },
        options: {
          // Option graphique responsive
          responsive: true, 
          maintainAspectRatio: true,
          plugins: {
            legend: {
              // Masquage de la légende
              display: false 
            }
          },
          scales: {
            y: {
              // Initialisation de la valeur 0 pour l'axe Y
              beginAtZero: true, 
              ticks: {
                callback: function(valeur) {
                  return valeur + '€'; 
                }
              }
            }
          }
        }
      });

      if (DebugConsole) {
        console.log("[renderCharts] Fin de création du graphique CA par mois");
      }
    }

    /*
    * ------- GRAPHIQUE : Commandes & CA par menu -------- 
    */
    // Récupération des données du chiffre d'affaires par menu
    const caParMenu = g.ca_par_menu || [];

    // Récupération du contexte du canvas pour le graphique
    const ctxMenus = document.getElementById('chart-menus');

    // Vérifie que le canvas qu'il y a des données à afficher
    if (ctxMenus && caParMenu.length > 0) {

      // Création du graphique
      const graphiqueMenus = new Chart(ctxMenus, {
        type: 'bar', 
        data: {
          // Mise à jour des labels d'après le noms des menus
          labels: caParMenu.map(function(element) {
            return element.menu;
          }),
          // Légende
          datasets: [
            {
              label: 'Commandes', 
              data: caParMenu.map(function(element) {
                return element.nombre_commandes; // Nombre de commandes
              }),
              backgroundColor: '#c8956c', 
              borderRadius: 4, 
              yAxisID: 'y' // Association à l'axe Y gauche
            },
            {
              label: 'CA (€)', 
              data: caParMenu.map(function(element) {
                // Valeurs du chiffre d'affaires
                return element.ca_total; 
              }),
              backgroundColor: '#cd5c5c', 
              borderRadius: 4,
              yAxisID: 'y1' // Association à l'axe Y droit
            }
          ]
        },
        options: {
          responsive: true, 
          maintainAspectRatio: true,
          scales: {
            // Axe Y gauche pour les commandes
            y: {
              beginAtZero: true,
              position: 'left',
              title: {
                display: true,
                // Titre de l'axe
                text: 'Nb Commandes' 
              }
            },
            // Axe Y droit pour le chiffre d'affaires
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                // Evite la supperpositions des lignes sur l'axe gauche
                drawOnChartArea: false 
              },
              title: {
                display: true,
                // Titre de l'axe
                text: 'CA (€)' 
              }
            }
          }
        }
      });

      if (DebugConsole) {
        console.log("[renderCharts] Fin de création du graphique CA par menu");
      }
    }
  }

  /* ===============================
      FONCTION : PIE CHART JS
        répartition des valeurs par statut
          Pour la récupération des données :
            - APPEL GET /api/commandes/admin 
     =============================== */
  async function loadStatutsPieChart() {

    try {
      const response = await fetch(`${API_URL}/api/commandes/admin`, { method: 'GET', headers: authHeaders });
      if (!response.ok) return;
      let result = {};
      try { result = await response.json(); } catch { result = {}; }

      const commandes = result.commandes || [];

      // Compter par statut
      const counts = {};
      commandes.forEach(function(c) {
        const statut = c.statut || 'Inconnu';
        counts[statut] = (counts[statut] || 0) + 1;
      });

      const labels = Object.keys(counts);
      const data = Object.values(counts);
      const colors = ['#c8956c', '#8fbc8f', '#6495ed', '#ffa500', '#cd5c5c', '#daa520', '#778899', '#ba55d3'];

      // Affichage du charts
      const ctxStatuts = document.getElementById('chart-statuts');
      if (ctxStatuts && labels.length > 0) {
        new Chart(ctxStatuts, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors.slice(0, labels.length)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: function(ctx) {
                    return ctx.label + ': ' + ctx.parsed + ' commande(s)';
                  }
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('[loadStatutsPieChart] Erreur :', err);
    }
  }

  /* ===============================
      INITIALISATION DES DONNEES
     =============================== */
  loadUserName();
  loadStatistiques();
  loadGraphiques();
}
