import { handleLocalDemoRequest, isLocalDemoToken, LOCAL_DEMO_ENABLED } from './localDemo';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://mcqp-ortal.onrender.com');

export function getApiUrl() {
  return API_URL.replace(/\/$/, '');
}

export async function apiFetch(path, { token, ...options } = {}) {
  // TEMPORARY: local demo sessions never hit the network / DB (localhost only)
  if (LOCAL_DEMO_ENABLED && isLocalDemoToken(token)) {
    return handleLocalDemoRequest(path, {
      token,
      method: options.method || 'GET',
      body: options.body
    });
  }

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      headers
    });
  } catch {
    const error = new Error(
      `Cannot reach API at ${getApiUrl()}. If this is production, confirm the Render service is awake and VITE_API_URL is set.`
    );
    error.status = 0;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { response, data };
}

export { API_URL };
