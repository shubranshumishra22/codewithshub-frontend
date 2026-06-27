import axios from 'axios';
import { supabase } from './supabaseClient';

export const api = axios.create({
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

export function apiPostForm(url, formData) {
  return getAuthHeaders().then((headers) =>
    api.post(url, formData, { headers })
  );
}

export function apiDelete(url) {
  return apiRequest('delete', url);
}
