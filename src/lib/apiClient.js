import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function apiRequest(method, url, data) {
  const headers = await getAuthHeaders();
  return api.request({ method, url, data, headers });
}

export function apiGet(url) {
  return apiRequest('get', url);
}

export function apiPost(url, data) {
  return apiRequest('post', url, data);
}
