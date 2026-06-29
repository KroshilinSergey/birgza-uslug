// register.js - финальная версия
document.addEventListener("DOMContentLoaded", function() {
  const masterBtn = document.getElementById("masterBtn");
  const clientBtn = document.getElementById("clientBtn");
  const roleSelection = document.getElementById("roleSelection");
  const registrationForm = document.getElementById("registrationForm");
  const selectedRoleInfo = document.getElementById("selectedRoleInfo");
  const roleBadge = document.getElementById("roleBadge");
  const userRole = document.getElementById("userRole");
  const changeRoleBtn = document.getElementById("changeRoleBtn");
  const masterFields = document.getElementById("masterFields");
  const loginLink = document.getElementById("loginLink");
  const experienceInput = document.getElementById("experience");

  // ID основных специализаций
  const MAIN_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  const OTHER_IDS = [101,102,103,104,105,106,107,108,109];

  function showForm(role) {
    console.log("Выбрана роль:", role);
    roleSelection.style.display = "none";
    registrationForm.style.display = "block";
    selectedRoleInfo.style.display = "flex";
    loginLink.style.display = "block";
    userRole.value = role;
    roleBadge.textContent = role === "master" ? "Мастер" : "Заказчик";
    
    if (role === "master") {
      masterFields.style.display = "block";
      // Делаем поле experience обязательным для мастера
      if (experienceInput) experienceInput.required = true;
      loadSpecializations();
    } else {
      masterFields.style.display = "none";
      // Убираем обязательность для заказчика
      if (experienceInput) experienceInput.required = false;
    }
  }

  async function loadSpecializations() {
    const container = document.getElementById("specializationsGrid");
    if (!container) return;
    try {
      const response = await fetch("/api/categories");
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const categories = result.data;
        const mainSpecs = categories.filter(c => MAIN_IDS.includes(c.id));
        const otherSpecs = categories.filter(c => OTHER_IDS.includes(c.id));
        
        let html = '<div class="spec-group"><div class="spec-group-title">Основные услуги</div>';
        html += mainSpecs.map(cat => `
          <label class="specialization-checkbox">
            <input type="checkbox" name="specializations" value="${cat.id}">
            <span>${cat.name}</span>
          </label>
        `).join('');
        html += '</div>';
        
        html += '<div class="spec-group other-group">';
        html += '<button type="button" class="other-toggle" id="otherToggleBtn">📂 Прочие услуги ▼</button>';
        html += '<div class="other-specs" id="otherSpecs" style="display: none;">';
        html += otherSpecs.map(cat => `
          <label class="specialization-checkbox">
            <input type="checkbox" name="specializations" value="${cat.id}">
            <span>${cat.name}</span>
          </label>
        `).join('');
        html += '</div></div>';
        
        container.innerHTML = html;
        
        const toggleBtn = document.getElementById("otherToggleBtn");
        const otherDiv = document.getElementById("otherSpecs");
        if (toggleBtn && otherDiv) {
          toggleBtn.onclick = () => {
            if (otherDiv.style.display === "none") {
              otherDiv.style.display = "block";
              toggleBtn.innerHTML = "📂 Прочие услуги ▲";
            } else {
              otherDiv.style.display = "none";
              toggleBtn.innerHTML = "📂 Прочие услуги ▼";
            }
          };
        }
      }
    } catch(e) {
      console.error("Ошибка загрузки:", e);
    }
  }

  if (masterBtn) masterBtn.addEventListener("click", () => showForm("master"));
  if (clientBtn) clientBtn.addEventListener("click", () => showForm("client"));
  
  if (changeRoleBtn) {
    changeRoleBtn.addEventListener("click", () => {
      roleSelection.style.display = "flex";
      registrationForm.style.display = "none";
      selectedRoleInfo.style.display = "none";
      loginLink.style.display = "none";
    });
  }

  if (registrationForm) {
    registrationForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const name = document.getElementById("name").value.trim();
      const phoneInput = document.getElementById("phone");
      let phone = phoneInput.value;
      if (phoneInput.dataset.cleanPhone) {
        phone = phoneInput.dataset.cleanPhone;
      } else {
        const digits = phone.replace(/\D/g, "");
        phone = "+7" + digits.slice(1);
      }
      const digits = phoneRaw.replace(/\D/g, "");
      // phone уже обработан выше
      const password = document.getElementById("password").value;
      const city = document.getElementById("city").value.trim();
      const role = userRole.value;
      
      if (!name || !phone || !password || !city) {
        alert("Заполните все обязательные поля");
        return;
      }
      
      let specializations = [];
      let experience = 0;
      if (role === "master") {
        document.querySelectorAll('input[name="specializations"]:checked').forEach(cb => {
          specializations.push(cb.value);
        });
        experience = parseInt(document.getElementById("experience").value) || 0;
        if (experience === 0) {
          // Разрешаем 0 лет опыта
        }
      }
      
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, password, role, city, specializations, experience })
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = role === "master" ? "master-cabinet.html" : "client-cabinet.html";
        } else {
          alert("Ошибка: " + data.message);
        }
      } catch(error) {
        alert("Ошибка: " + error.message);
      }
    });
  }
  
  // Маска телефона
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function(e) {
      let digits = e.target.value.replace(/\D/g, "").slice(0, 10);
      let formatted = "";
      if (digits.length > 0) {
        if (digits.length <= 3) formatted = digits;
        else if (digits.length <= 6) formatted = digits.slice(0, 3) + " " + digits.slice(3);
        else if (digits.length <= 8) formatted = digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);
        else formatted = digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6, 8) + " " + digits.slice(8, 10);
      }
      e.target.value = formatted;
    });
  }
});

// Функции для модалки
function openPrivacyModal(tab = "privacy") {
  const modal = document.getElementById("privacyModal");
  if (!modal) return;
  const tabs = document.querySelectorAll(".privacy-tab");
  const contents = document.querySelectorAll(".privacy-content");
  tabs.forEach(t => t.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));
  const activeTab = document.querySelector(`.privacy-tab[data-tab="${tab}"]`);
  const activeContent = document.getElementById(tab === "privacy" ? "privacyContent" : "termsContent");
  if (activeTab) activeTab.classList.add("active");
  if (activeContent) activeContent.classList.add("active");
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closePrivacyModal() {
  const modal = document.getElementById("privacyModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}
