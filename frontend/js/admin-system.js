// admin-system.js
document.addEventListener("DOMContentLoaded", async function () {
  // Проверка авторизации и роли admin
  try {
    const userData = await apiRequest("GET", "/auth/me");
    if (userData.user.role !== "admin") {
      window.location.href = "index.html";
      return;
    }
    loadUsers();
  } catch (error) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearAuth();
    window.location.href = "index.html";
  });
});

async function loadUsers() {
  try {
    const result = await apiRequest("GET", "/admin/users");
    const users = result.data;

    const usersCount = document.getElementById("usersCount");
    if (usersCount) usersCount.textContent = users.length;

    const tbody = document.querySelector("#usersTable tbody");
    if (tbody) {
      tbody.innerHTML = "";

      users.forEach((user) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = user.id;
        row.insertCell(1).textContent = user.name;
        row.insertCell(2).textContent = user.phone;
        row.insertCell(3).textContent = user.role;
        row.insertCell(4).textContent = user.city || "не указан";
        row.insertCell(5).innerHTML = `
          <button onclick="deleteUser(${user.id})" class="btn-delete">Удалить</button>
          <button onclick="toggleBlock(${user.id}, ${user.isBlocked || false})" class="btn-block">
            ${user.isBlocked ? "Разблокировать" : "Заблокировать"}
          </button>
        `;
      });
    }
  } catch (error) {
    console.error("Ошибка загрузки пользователей:", error);
  }
}

async function deleteUser(id) {
  if (confirm("Удалить пользователя?")) {
    try {
      await apiRequest("DELETE", `/admin/users/${id}`);
      loadUsers();
    } catch (error) {
      alert("Ошибка при удалении: " + error.message);
    }
  }
}

async function toggleBlock(id, isBlocked) {
  try {
    await apiRequest("PUT", `/admin/users/${id}/block`, {
      isBlocked: !isBlocked,
    });
    loadUsers();
  } catch (error) {
    alert("Ошибка при блокировке: " + error.message);
  }
}
