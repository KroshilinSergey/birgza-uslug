const API_BASE_URL = "/api";
function getToken() {
  return localStorage.getItem("remont_token");
}
function setAuth(token, user) {
  localStorage.setItem("remont_token", token);
  localStorage.setItem("remont_user", JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem("remont_token");
  localStorage.removeItem("remont_user");
}

async function apiRequest(method, endpoint, data = null, auth = true) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("Не авторизован");
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  if (data) options.body = JSON.stringify(data);
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 && auth) {
        clearAuth();
        if (
          window.location.pathname !== "/index.html" &&
          window.location.pathname !== "/"
        )
          window.location.href = "index.html";
      }
      throw new Error(result.message || "Ошибка запроса");
    }
    console.log(`API ${method} ${endpoint}`, {
      request: data,
      response: result,
    });
    return result;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
}
