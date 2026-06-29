import { getDemoStore } from "./store";

const SESSION_KEY = "pos-demo-session";
const listeners = new Set();

function readSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function writeSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  listeners.forEach((cb) => cb("SIGNED_IN", session ? { user: session.user } : null));
}

export function demoGetSession() {
  const session = readSession();
  return { data: { session } };
}

export function demoGetUser() {
  const session = readSession();
  return { data: { user: session?.user ?? null } };
}

export function demoSignIn({ email, password }) {
  const store = getDemoStore();
  const user = (store.demo_users || []).find(
    (u) => u.email === email.trim().toLowerCase() && u.active !== false
  );

  if (!user || user.password !== password) {
    return {
      error: {
        message:
          "Credenciales inválidas. Pruebe superadmin@pos.demo / SuperAdmin123!",
      },
    };
  }

  const session = {
    user: { id: user.id, email: user.email },
    access_token: "demo-token",
  };
  writeSession(session);
  return { error: null };
}

export function demoSignOut() {
  writeSession(null);
  return { error: null };
}

export function demoOnAuthStateChange(callback) {
  listeners.add(callback);
  return {
    data: {
      subscription: {
        unsubscribe: () => listeners.delete(callback),
      },
    },
  };
}
