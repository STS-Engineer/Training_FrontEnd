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

/**
 * Change password for the authenticated user.
 * @param {number} memberId - ID du membre
 * @param {string} oldPassword - Ancien mot de passe
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<{ message: string }>}
 */
export async function changePassword(memberId, oldPassword, newPassword) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/users/${memberId}/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
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

// ── Mark training done ───────────────────────────────────────────────────────

/**
 * Marque une formation comme terminée côté trainer.
 * Les 3 champs sont optionnels: doc, link, description_done.
 * @param {number} trainingId
 * @param {File|null} docFile
 * @param {{ link?: string|null, description_done?: string|null }} payload
 */
export async function markTrainingDone(trainingId, docFile = null, payload = {}) {
  const formData = new FormData();
  if (docFile) formData.append('doc', docFile);
  formData.append('link', payload.link ? String(payload.link).trim() : '');
  formData.append('description_done', payload.description_done ? String(payload.description_done).trim() : '');

  console.log('Envoi de fin de formation pour training ID:', trainingId, docFile ? docFile.name : 'no-doc');
  const token = await getToken();
  const res = await fetch(`${API_URL}/trainings/${trainingId}/done`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Compatibilité avec l'ancien appel (trainingId, formData).
 * @deprecated Utiliser markTrainingDone(trainingId, docFile, payload)
 */
export async function sendCompletionDoc(trainingId, formData) {
  const doc = formData?.get?.('doc') ?? null;
  const link = formData?.get?.('link') ?? '';
  const descriptionDone = formData?.get?.('description_done') ?? '';
  return markTrainingDone(trainingId, doc, {
    link,
    description_done: descriptionDone,
  });
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

