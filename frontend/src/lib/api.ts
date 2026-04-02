export const API_BASE = "http://localhost:3001";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getAuthHeaders(omitContentType = false): HeadersInit {
  const token = getToken();
  return {
    ...(omitContentType ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(isFormData), ...(options.headers as object) },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  return res;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string, profilePicture?: File) => {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      form.append("password", password);
      if (profilePicture) form.append("profilePicture", profilePicture);
      return fetch(`${API_BASE}/api/auth/register`, { method: "POST", body: form });
    },
    me: () => fetchWithAuth("/api/auth/me"),
    updateProfile: (data: {
      name?: string;
      location?: string;
      bio?: string;
      theme?: string;
      accentColor?: string;
      units?: "metric" | "imperial";
      notificationPreferences?: { push?: boolean; workoutReminders?: boolean; mealReminders?: boolean };
      goals?: { calorieTarget?: number; waterGoalL?: number; workoutsPerWeek?: number };
    } | FormData) =>
      fetchWithAuth("/api/auth/profile", {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      fetchWithAuth("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    exportData: () => fetchWithAuth("/api/auth/export"),
  },
  workouts: {
    list: () => fetchWithAuth("/api/workouts"),
    create: (body: object) =>
      fetchWithAuth("/api/workouts", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      fetchWithAuth(`/api/workouts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => fetchWithAuth(`/api/workouts/${id}`, { method: "DELETE" }),
    exportCsv: async () => {
      const res = await fetchWithAuth("/api/workouts/export?format=csv");
      if (!res.ok) throw new Error((await res.json()).message || "Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workouts-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
  },
  nutrition: {
    list: () => fetchWithAuth("/api/nutrition"),
    create: (body: object) =>
      fetchWithAuth("/api/nutrition", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      fetchWithAuth(`/api/nutrition/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => fetchWithAuth(`/api/nutrition/${id}`, { method: "DELETE" }),
    exportCsv: async () => {
      const res = await fetchWithAuth("/api/nutrition/export?format=csv");
      if (!res.ok) throw new Error((await res.json()).message || "Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nutrition-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
  },
  users: {
    search: (q: string) => fetchWithAuth(`/api/users?q=${encodeURIComponent(q)}`),
    getProfile: (id: string) => fetchWithAuth(`/api/users/${id}`),
  },
  progress: {
    list: () => fetchWithAuth("/api/progress"),
    upsert: (body: object) =>
      fetchWithAuth("/api/progress", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) => fetchWithAuth(`/api/progress/${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: () => fetchWithAuth("/api/notifications"),
    create: (body: { type?: string; title?: string; message: string; dueTime?: string }) =>
      fetchWithAuth("/api/notifications", { method: "POST", body: JSON.stringify(body) }),
    markRead: (id: string) =>
      fetchWithAuth(`/api/notifications/${id}/read`, { method: "PATCH" }),
    update: (id: string, body: { type?: string; title?: string; message?: string; dueTime?: string | null }) =>
      fetchWithAuth(`/api/notifications/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => fetchWithAuth(`/api/notifications/${id}`, { method: "DELETE" }),
  },
  feedback: {
    list: () => fetchWithAuth("/api/feedback"),
    submit: (body: { type?: string; subject?: string; message: string; email?: string }) =>
      fetchWithAuth("/api/feedback", { method: "POST", body: JSON.stringify(body) }),
  },
};
