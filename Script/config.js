// config.js — URL de base de l'API
const dev = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

/*
export const API_URL = dev 
    ? 'http://127.0.0.1:8000' 
    : 'https://vite-et-gourmand-api-2b0eeb54e8d5.herokuapp.com';
*/
//Toujours utiliser l'API prod même en dev
export const API_URL = 'https://vite-et-gourmand-api-2b0eeb54e8d5.herokuapp.com';


