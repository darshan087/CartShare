const USER_KEY = "cartshare:user";

export function getUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

export function saveUser(name) {
  const user = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name: name.trim() };
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
