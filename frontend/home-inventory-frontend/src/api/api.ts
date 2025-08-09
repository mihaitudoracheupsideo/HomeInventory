
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5005/api', // Adjust the base URL as needed
  headers: {
    'Content-Type': 'application/json',
  },
});