// client-cabinet.js - исправленная версия с рабочим поиском
(function() {
  console.log("🔧 client-cabinet.js загружен");
  
  // ID основных специализаций (1-16)
  const MAIN_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  const OTHER_IDS = [101,102,103,104,105,106,107,108,109];
  
  // Карта специализаций (ID -> название)
  let specializationsMap = {};
  
  async function loadSpecializationsMap() {
    try {
      const response = await fetch("/api/categories");
      const result = await response.json();
      if (result.success) {
        specializationsMap = {};
        result.data.forEach(cat => {
          specializationsMap[cat.id] = cat.name;
          specializationsMap[String(cat.id)] = cat.name;
        });
        console.log("✅ Загружены названия специализаций");
      }
    } catch(e) {
      console.error("Ошибка загрузки:", e);
    }
  }
  
  function formatSpecs(specs) {
    if (!specs || !specs.length) return "—";
    return specs.map(s => specializationsMap[s] || specializationsMap[String(s)] || s).join(", ");
  }
  
  // Загрузка данных пользователя
  function loadUserData() {
    try {
      const userJson = localStorage.getItem("user") || localStorage.getItem("remont_user");
      if (!userJson) return;
      const user = JSON.parse(userJson);
      
      const nameEl = document.getElementById("userName");
      const welcomeEl = document.getElementById("welcomeName");
      const avatarEl = document.getElementById("userAvatar");
      const cityEl = document.getElementById("currentCity");
      
      if (nameEl) nameEl.textContent = user.name || "Клиент";
      if (welcomeEl) welcomeEl.textContent = user.name || "Клиент";
      if (avatarEl) {
        avatarEl.textContent = (user.name || "К").charAt(0).toUpperCase();
        avatarEl.style.background = "linear-gradient(135deg, #667eea, #764ba2)";
        avatarEl.style.display = "flex";
        avatarEl.style.alignItems = "center";
        avatarEl.style.justifyContent = "center";
        avatarEl.style.color = "white";
        avatarEl.style.fontWeight = "bold";
        avatarEl.style.fontSize = "22px";
        avatarEl.style.width = "60px";
        avatarEl.style.height = "60px";
        avatarEl.style.borderRadius = "50%";
      }
      if (cityEl) cityEl.textContent = user.city || "Город не выбран";
    } catch(e) {
      console.error("Ошибка загрузки пользователя:", e);
    }
  }
  
  async function loadSpecializationsForSearch() {
    const container = document.getElementById("searchSpecializationsGrid");
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
            <input type="checkbox" name="search_specializations" value="${cat.id}">
            <span>${cat.name}</span>
          </label>
        `).join('');
        html += '</div>';
        
        html += '<div class="spec-group other-group">';
        html += '<button type="button" class="other-toggle" id="searchOtherToggle">📂 Прочие услуги ▼</button>';
        html += '<div class="other-specs" id="searchOtherSpecs" style="display: none;">';
        html += otherSpecs.map(cat => `
          <label class="specialization-checkbox">
            <input type="checkbox" name="search_specializations" value="${cat.id}">
            <span>${cat.name}</span>
          </label>
        `).join('');
        html += '</div></div>';
        
        container.innerHTML = html;
        
        const toggleBtn = document.getElementById("searchOtherToggle");
        const otherDiv = document.getElementById("searchOtherSpecs");
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
  
  window.searchMasters = async function() {
    await loadSpecializationsMap();
    const city = document.getElementById("searchCity")?.value.trim() || "Тольятти";
    const token = localStorage.getItem("token") || localStorage.getItem("remont_token");
    if (!token) {
      alert("Войдите в систему");
      window.location.href = "login.html";
      return;
    }
    
    const selectedSpecs = [];
    document.querySelectorAll('#searchSpecializationsGrid input[type="checkbox"]:checked').forEach(cb => {
      selectedSpecs.push(cb.value);
    });
    
    try {
      let url = `/api/users/masters?city=${encodeURIComponent(city)}`;
      if (selectedSpecs.length > 0) {
        selectedSpecs.forEach(spec => {
          url += `&spec=${spec}`;
        });
      }
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Ошибка запроса");
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      const masters = result.data || [];
      const container = document.getElementById("mastersList");
      const countSpan = document.getElementById("mastersCount");
      if (countSpan) countSpan.textContent = `(${masters.length})`;
      
      if (masters.length === 0) {
        container.innerHTML = '<div class="empty-state">Мастеров не найдено</div>';
      } else {
        let html = '';
        masters.forEach(master => {
          html += `
            <div style="display:flex; gap:15px; padding:15px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:15px; background:white; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <div style="width:60px; height:60px; min-width:60px; background:linear-gradient(135deg, #667eea, #764ba2); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:22px; font-weight:bold;">${(master.name || "М").charAt(0).toUpperCase()}</div>
              <div>
                <h3 style="margin:0 0 5px 0;">${escapeHtml(master.name)}</h3>
                <div>⭐ ${master.rating || 0} (${master.reviewsCount || 0} отзывов)</div>
                <div>📍 Город: ${escapeHtml(master.city || "Не указан")}</div>
                <div><span style="color:#4a5568; font-weight:bold;">🔧 Специализации:</span> <span style="color:#4a5568;">${formatSpecs(master.specializations)}</span></div>
                <button class="chat-master-btn" data-id="${master.id}" data-name="${escapeHtml(master.name)}" style="margin-top:10px; padding:8px 20px; background:#4299e1; color:white; border:none; border-radius:5px; cursor:pointer;">📩 Написать мастеру</button>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
        
        // Привязываем кнопки чата
        document.querySelectorAll(".chat-master-btn").forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            const name = btn.getAttribute("data-name");
            if (typeof window.openChatWithMasterDirect === "function") {
              window.openChatWithMasterDirect(id, name);
            } else {
              alert("Функция чата загружается");
            }
          };
        });
      }
      
      document.getElementById("searchResults").style.display = "block";
      document.getElementById("searchResults").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch(e) {
      console.error(e);
      alert("Ошибка поиска: " + e.message);
    }
  };
  
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    });
  }
  
  window.hideFindMasterModal = function() {
    const modal = document.getElementById("findMasterModal");
    if (modal) modal.style.display = "none";
  };
  
  function bindButtons() {
    loadUserData();
    
    const findMasterBtn = document.getElementById("findMasterBtn");
    if (findMasterBtn) {
      findMasterBtn.onclick = (e) => {
        e.preventDefault();
        loadSpecializationsForSearch();
        document.getElementById("findMasterModal").style.display = "flex";
      };
    }
    
    const searchBtn = document.getElementById("searchMastersBtn");
    if (searchBtn) {
      searchBtn.onclick = (e) => {
        e.preventDefault();
        window.searchMasters();
      };
    }
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "index.html";
      };
    }
  }
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindButtons);
  } else {
    bindButtons();
  }
})();
