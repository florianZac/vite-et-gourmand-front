import Route from "./Route.js";

//Définir ici vos routes
export const allRoutes = [
    new Route("/", "Accueil", "/Pages/home.html","/", [] , false ),
];

//Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "Vite & Gourmand";