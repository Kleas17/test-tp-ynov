import axios from 'axios';
const DEFAULT_API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.REACT_APP_SERVER_PORT ? `http://localhost:${process.env.REACT_APP_SERVER_PORT}` : DEFAULT_API_BASE_URL);
const USERS_PATH = '/users';
function buildRequestConfig() {
  const apiToken = process.env.REACT_APP_API_TOKEN;
  if (!apiToken) {
    return {};
  }
  return {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  };
}
function normalizeApiUsers(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.utilisateurs)) {
    return data.utilisateurs;
  }
  return [];
}
function mapApiUser(rawUser = {}) {
  const completeName = (rawUser.name || '').trim();
  const [nomFromName = '', ...prenomParts] = completeName.split(' ').filter(Boolean);
  return {
    nom: rawUser.nom || nomFromName || '',
    prenom: rawUser.prenom || prenomParts.join(' ') || '',
    email: rawUser.email || '',
    dateNaissance: rawUser.dateNaissance || '1990-01-01',
    cp: rawUser.cp || rawUser.address?.zipcode || '',
    ville: rawUser.ville || rawUser.address?.city || ''
  };
}
export async function getRegistrations() {
  const response = await axios.get(`${API_BASE_URL}${USERS_PATH}`, buildRequestConfig());
  return normalizeApiUsers(response.data).map(mapApiUser);
}
export async function createRegistration(user) {
  const response = await axios.post(`${API_BASE_URL}${USERS_PATH}`, user, buildRequestConfig());
  return response.data;
}
export async function countUsers() {
  const response = await axios.get(`${API_BASE_URL}${USERS_PATH}`, buildRequestConfig());
  return normalizeApiUsers(response.data).length;
}