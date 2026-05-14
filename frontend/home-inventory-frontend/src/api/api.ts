
import axios from 'axios';

// Detectează automat IP-ul curent din browser pentru a evita hardcodarea
const getCurrentHost = () => {
  // În development, folosește hostname-ul curent (IP-ul de pe care rulează Vite)
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

const API_PORT = '5443'; // Portul backend-ului HTTPS
export const API_BASE_URL = `https://${getCurrentHost()}:${API_PORT}`;

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // HTTPS for secure camera access
  headers: {
    'Content-Type': 'application/json',
  },
});