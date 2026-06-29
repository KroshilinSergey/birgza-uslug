// client-cabinet.js - полная версия с плавной прокруткой и активной вкладкой по умолчанию
(function() {
  console.log("🔧 client-cabinet.js загружен (v.72 - независимый поиск)");
  
  const MAIN_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  const OTHER_IDS = [101,102,103,104,105,106,107,108,109];
  
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
  
  // Делаем функцию доступной глобально для других функций
  window.formatSpecs = function(specs) {
    if (!specs || !specs.length) return "—";
    return specs.map(s => specializationsMap[s] || specializationsMap[String(s)] || s).join(", ");
  };
  
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
      if (cityEl) {
        const city = user.city || localStorage.getItem("remont_city") || "Город не выбран";
        cityEl.textContent = city;
        if (!user.city && city !== "Город не выбран") {
          user.city = city;
          localStorage.setItem("remont_user", JSON.stringify(user));
          localStorage.setItem("user", JSON.stringify(user));
        }
      }
      
      const token = localStorage.getItem("token") || localStorage.getItem("remont_token");
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("remont_token", token);
      }
      
      return user;
    } catch(e) {
      console.error("❌ Ошибка загрузки пользователя:", e);
      return null;
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
  
  // ====== ОСНОВНОЙ ПОИСК (из ЛК) ======
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
      
      renderMasters(result.data || []);
      
    } catch(e) {
      console.error(e);
      alert("Ошибка поиска: " + e.message);
    }
  };
  
  // ====== ПОИСК ИЗ ДЕТАЛЕЙ ЗАКАЗА ======
  window.findMastersForOrder = function(orderId) {
    const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
    if (!token) {
      alert('Войдите в систему');
      return;
    }
    
    const modal = document.getElementById('findMasterModal');
    if (!modal) {
      alert('Модалка поиска не найдена');
      return;
    }
    
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('mastersList').innerHTML = '<div class="loading">Поиск...</div>';
    modal.style.display = 'flex';
    
    fetch(`/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(result => {
      if (!result.success) throw new Error(result.message);
      const order = result.data;
      
      const userJson = localStorage.getItem('user') || localStorage.getItem('remont_user');
      const user = JSON.parse(userJson);
      const city = user.city || '';
      
      const cityInput = document.getElementById('searchCity');
      if (cityInput) cityInput.value = city;
      
      // Снимаем все выделения с чекбоксов
      document.querySelectorAll('#searchSpecializationsGrid input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      
      // Запускаем поиск с параметрами из заказа
      searchMastersWithParams(city, order.category ? [order.category] : []);
    })
    .catch(error => {
      console.error('Ошибка:', error);
      alert('Ошибка: ' + error.message);
      modal.style.display = 'none';
    });
  };

  // ====== ВСПОМОГАТЕЛЬНЫЙ ПОИСК С ПАРАМЕТРАМИ ======
  async function searchMastersWithParams(city, specs) {
    const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
    if (!token) {
      alert('Войдите в систему');
      return;
    }
    
    try {
      let url = `/api/users/masters?city=${encodeURIComponent(city)}`;
      if (specs && specs.length > 0) {
        specs.forEach(spec => {
          url += `&spec=${spec}`;
        });
      }
      
      console.log('🔍 Поиск по параметрам:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Ошибка запроса');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      renderMasters(result.data || []);
      
    } catch(e) {
      console.error(e);
      document.getElementById('mastersList').innerHTML = '<div class="error">Ошибка поиска: ' + e.message + '</div>';
    }
  }

  // ====== ОТРИСОВКА МАСТЕРОВ ======
  function renderMasters(masters) {
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
              <div><span style="color:#4a5568; font-weight:bold;">🔧 Специализации:</span> <span style="color:#4a5568;">${window.formatSpecs(master.specializations)}</span></div>
              <button class="chat-master-btn" data-id="${master.id}" data-name="${escapeHtml(master.name)}" style="margin-top:10px; padding:8px 20px; background:#4299e1; color:white; border:none; border-radius:5px; cursor:pointer;">📩 Написать мастеру</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      
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
  }
  
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
  
  // ====== ЗАГРУЗКА ЗАКАЗОВ ======
  window.loadClientOrders = async function() {
    const container = document.getElementById('clientOrdersList');
    if (!container) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        container.innerHTML = '<div class="empty-state">Войдите в систему</div>';
        return;
      }
      
      const response = await fetch('/api/orders/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки заказов');
      const result = await response.json();
      
      if (!result.success) throw new Error(result.message);
      
      const orders = (result.data || []).filter(o => 
        o.status !== 'completed' && o.status !== 'cancelled'
      );
      
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clipboard-list fa-3x"></i>
            <h3>У вас пока нет активных заказов</h3>
            <p>Создайте новый заказ, и мастера смогут откликнуться</p>
          </div>
        `;
        return;
      }
      
      let html = '';
      orders.forEach(order => {
        const statusMap = {
          'new': 'Новый',
          'in_progress': 'В работе',
          'awaiting_confirmation': 'Ожидает подтверждения'
        };
        const statusClass = order.status || 'new';
        html += `
          <div class="order-card" data-id="${order.id}">
            <div class="order-header">
              <h3>${escapeHtml(order.title)}</h3>
              <span class="order-status ${statusClass}">${statusMap[statusClass] || statusClass}</span>
            </div>
            <div class="order-body">
              <p>${escapeHtml(order.description)}</p>
              <div class="order-meta">
                <span><i class="fas fa-tag"></i> ${escapeHtml(order.categoryName || 'Без категории')}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      container.innerHTML = '<div class="error">Не удалось загрузить заказы</div>';
    }
  };

  window.loadArchivedOrders = async function() {
    const container = document.getElementById('clientArchiveList');
    if (!container) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        container.innerHTML = '<div class="empty-state">Войдите в систему</div>';
        return;
      }
      
      const response = await fetch('/api/orders/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки заказов');
      const result = await response.json();
      
      if (!result.success) throw new Error(result.message);
      
      const orders = (result.data || []).filter(o => 
        o.status === 'completed' || o.status === 'cancelled'
      );
      
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-archive fa-3x"></i>
            <h3>Архив пуст</h3>
            <p>Здесь будут отображаться завершенные и отмененные заказы</p>
          </div>
        `;
        return;
      }
      
      let html = '';
      orders.forEach(order => {
        const statusMap = {
          'completed': 'Завершён',
          'cancelled': 'Отменён'
        };
        const statusClass = order.status || 'completed';
        html += `
          <div class="order-card archived" data-id="${order.id}">
            <div class="order-header">
              <h3>${escapeHtml(order.title)}</h3>
              <span class="order-status ${statusClass}">${statusMap[statusClass] || statusClass}</span>
            </div>
            <div class="order-body">
              <p>${escapeHtml(order.description)}</p>
              <div class="order-meta">
                <span><i class="fas fa-tag"></i> ${escapeHtml(order.categoryName || 'Без категории')}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      
    } catch (error) {
      console.error('Ошибка загрузки архива:', error);
      container.innerHTML = '<div class="error">Не удалось загрузить архив</div>';
    }
  };

  // ====== ОТКРЫТИЕ ДЕТАЛЕЙ ЗАКАЗА ======
  window.openOrderDetails = function(orderId) {
    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');
    if (!modal || !content) return;
    
    content.innerHTML = '<p>Загрузка...</p>';
    modal.style.display = 'flex';
    
    const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
    if (!token) {
      content.innerHTML = '<p>Ошибка: не авторизован</p>';
      return;
    }
    
    fetch(`/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Ошибка загрузки');
      return res.json();
    })
    .then(result => {
      if (!result.success) throw new Error(result.message);
      const order = result.data;
      
      const statusMap = {
        'new': 'Новый',
        'in_progress': 'В работе',
        'awaiting_confirmation': 'Ожидает подтверждения',
        'completed': 'Завершён',
        'cancelled': 'Отменён'
      };
      
      let actionButtons = '';
      
      if (order.status === 'new') {
        actionButtons = `
          <button class="btn-find-master" onclick="window.findMastersForOrder(${order.id})">🔍 Найти мастера</button>
          <button class="btn-change-status" onclick="window.showCloseReasonModal(${order.id})">🔄 Изменить статус</button>
        `;
      } else if (order.status === 'in_progress') {
        if (order.masterId) {
          actionButtons = `
            <button class="btn-confirm-complete" onclick="window.openCompleteConfirm(${order.id})">
              ✅ Подтвердить выполнение
            </button>
          `;
        }
      } else if (order.status === 'awaiting_confirmation') {
        actionButtons = `
          <button class="btn-find-master" onclick="window.findMastersForOrder(${order.id})">🔍 Найти мастера</button>
          <button class="btn-change-status" onclick="window.showCloseReasonModal(${order.id})">🔄 Изменить статус</button>
        `;
      } else {
        actionButtons = `
          <button class="btn-close-order" onclick="window.closeOrderDetails()">Закрыть</button>
        `;
      }
      
      let masterInfo = '';
      if (order.masterName) {
        masterInfo = `<p><strong>Мастер:</strong> ${escapeHtml(order.masterName)}</p>`;
      } else if (order.masterId) {
        masterInfo = `<p><strong>Мастер:</strong> ID: ${order.masterId}</p>`;
      }
      
      content.innerHTML = `
        <div class="order-detail">
          <h3>${escapeHtml(order.title)}</h3>
          <p><strong>Описание:</strong> ${escapeHtml(order.description || 'Нет описания')}</p>
          <p><strong>Категория:</strong> ${escapeHtml(order.categoryName || 'Без категории')}</p>
          <p><strong>Адрес:</strong> ${escapeHtml(order.address || 'Не указан')}</p>
          <p><strong>Статус:</strong> <span class="status-badge ${order.status}">${statusMap[order.status] || order.status}</span></p>
          <p><strong>Создан:</strong> ${new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
          ${masterInfo}
          <div class="order-detail-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error('Ошибка:', error);
      content.innerHTML = '<p style="color:red;">Не удалось загрузить детали заказа</p>';
    });
  };

  window.closeOrderDetails = function() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) modal.style.display = 'none';
  };

  window.closeOrder = function(orderId) {
    alert('Функция "Закрыть заказ" будет добавлена позже');
    window.closeOrderDetails();
  };

  window.offerToMaster = function(orderId) {
    alert('Функция "Предложить мастеру" будет добавлена позже');
    window.closeOrderDetails();
  };

  // ====== ПЛАВНАЯ ПРОКРУТКА ======
  function scrollToTab(tabId) {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      setTimeout(() => {
        tabElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    }
  }

  // ====== АКТИВАЦИЯ ВКЛАДКИ ПО УМОЛЧАНИЮ ======
  function activateDefaultTab() {
    const defaultTab = document.querySelector('.sidebar-menu .menu-item[data-tab="my-orders"]');
    if (defaultTab) {
      defaultTab.classList.add('active');
    }
    
    const myOrdersTab = document.getElementById('my-ordersTab');
    if (myOrdersTab) {
      myOrdersTab.classList.add('active');
    }
    
    setTimeout(() => window.loadClientOrders(), 300);
  }

  // ====== ИНИЦИАЛИЗАЦИЯ ======
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
  
  document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    bindButtons();
    activateDefaultTab();
    
    document.addEventListener('click', function(e) {
      const card = e.target.closest('.order-card');
      if (card) {
        const orderId = card.dataset.id;
        if (orderId) {
          e.preventDefault();
          window.openOrderDetails(orderId);
        }
      }
    });
    
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', function(e) {
        const tabId = this.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        this.classList.add('active');
        
        if (tabId === 'my-orders') {
          const tab = document.getElementById('my-ordersTab');
          if (tab) {
            tab.classList.add('active');
            scrollToTab('my-ordersTab');
            setTimeout(() => window.loadClientOrders(), 200);
          }
        } else if (tabId === 'archive') {
          const tab = document.getElementById('archiveTab');
          if (tab) {
            tab.classList.add('active');
            scrollToTab('archiveTab');
            setTimeout(() => window.loadArchivedOrders(), 200);
          }
        } else if (tabId === 'messages') {
          const tab = document.getElementById('messagesTab');
          if (tab) {
            tab.classList.add('active');
            scrollToTab('messagesTab');
            if (window.chatUI) {
              setTimeout(() => window.chatUI.renderMessagesTab(), 200);
            }
          }
        }
      });
    });
    
    console.log("✅ client-cabinet.js загружен (независимый поиск)");
  });
})();
