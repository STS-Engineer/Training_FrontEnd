const SESSION_MS = 48 * 60 * 60 * 1000;

export function setSession(token, member) {
  const expiry = Date.now() + SESSION_MS;
  localStorage.setItem('avo_token',  token);
  localStorage.setItem('avo_member', JSON.stringify(member ?? {}));
  localStorage.setItem('avo_expiry', String(expiry));
}

export function getSession() {
  const expiry = Number(localStorage.getItem('avo_expiry') ?? 0);
  if (!expiry || Date.now() > expiry) {
    clearSession();
    return { token: null, member: null };
  }
  const token  = localStorage.getItem('avo_token');
  const member = JSON.parse(localStorage.getItem('avo_member') ?? '{}');
  return { token, member };
}

export function clearSession() {
  localStorage.removeItem('avo_token');
  localStorage.removeItem('avo_member');
  localStorage.removeItem('avo_expiry');
}

export function isAuthenticated() {
  const { token } = getSession();
  return !!token;
}
