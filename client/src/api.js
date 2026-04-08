// All requests go to the Express backend which holds the API keys

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:logout"));
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  login:  (username, password) => request("POST", "/api/login", { username, password }),
  logout: ()                   => request("POST", "/api/logout"),
  me:     ()                   => request("GET",  "/api/me"),

  storageGet: (key)        => request("GET",    `/api/storage/${key}`),
  storageSet: (key, value) => request("PUT",    `/api/storage/${key}`, { value }),
  storageDel: (key)        => request("DELETE",  `/api/storage/${key}`),

  ai: (system, messages)  => request("POST", "/api/ai", { system, messages }),
};
