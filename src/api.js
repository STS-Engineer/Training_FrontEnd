const API_URL =  'http://localhost:3000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Erreur serveur : ${res.status}`);
  }
  return json;
}

async function getToken() {
  // Support both localStorage (48h session) and legacy sessionStorage
  return localStorage.getItem('avo_token') ?? sessionStorage.getItem('avo_token') ?? '';
}

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * Récupère tous les utilisateurs actifs (pour la liste Requester).
 * @returns {Promise<Array>}
 */
export async function fetchUsers() {
  const res  = await fetch(`${API_URL}/users`);
  const json = await handleResponse(res);
  return json.data ?? [];
}

export async function fetchUserById(id) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/users/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await handleResponse(res);
  return json.data ?? json;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function fetchNotifications(userId) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/notifications?userId=${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}

export async function fetchUnreadCount(userId) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/notifications/unread-count?userId=${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await handleResponse(res);
  return json.count ?? 0;
}

export async function markNotificationRead(id) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}

export async function markAllNotificationsRead(userId) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/notifications/read-all?userId=${userId}`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}

export async function deleteNotification(id) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}


// ── Authentication ────────────────────────────────────────────────────────────

/**
 * Sign in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function signIn(email, password) {
  const res = await fetch(`${API_URL}/users/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  console.log('SignIn response status:', res);
  return handleResponse(res);
}

// ── Trainings ─────────────────────────────────────────────────────────────────

/**
 * Récupère toutes les demandes de formation.
 * @returns {Promise<Array>}
 */
export async function fetchTrainings() {
  const token = await getToken();
  const res = await fetch(`${API_URL}/trainings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await handleResponse(res);
  return json.data ?? [];
}

/**
 * Récupère une demande de formation par son ID.
 * @param {number} id
 */
export async function fetchTrainingById(id) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/trainings/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await handleResponse(res);
  return json.data ?? json;
}

/**
 * Met à jour une demande de formation (réservé au créateur).
 * @param {number} id
 * @param {FormData} formData
 */
export async function updateTraining(id, formData) {
  const token = await getToken();
  console.log('FormData envoyée :', formData);
  const res = await fetch(`${API_URL}/trainings/${id}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse(res);
}

// ── Completion document ───────────────────────────────────────────────────────

/**
 * Envoie la documentation de fin de training (PDF/Word) au propriétaire.
 * @param {number} trainingId
 * @param {FormData} formData  champs: doc (file)
 */
export async function sendCompletionDoc(trainingId, formData) {
  console.log('Envoi du document de fin de formation pour training ID:', trainingId, formData.get('doc').name);
  const token = await getToken();
  const res = await fetch(`${API_URL}/trainings/${trainingId}/done`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse(res);
}

// ── Training form submission ───────────────────────────────────────────────────

/**
 * Soumet le formulaire de demande de formation.
 * @param {FormData} formData 
 * @returns {Promise<object>} 
 */
export async function submitForm(formData) {
  const res = await fetch(`${API_URL}/trainings`, {
    method: 'POST',
    body: formData,
  });
  console.log('FormData envoyée :', formData);
  return handleResponse(res);
}

