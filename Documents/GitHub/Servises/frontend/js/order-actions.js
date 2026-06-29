// order-actions.js - автономный модуль действий с заказами
(function() {
  console.log("🔧 order-actions.js загружен (v.2)");

  let currentOrderId = null;
  let currentMasters = [];

  // ====== ОТКРЫТИЕ МОДАЛКИ ПРИЧИНЫ ЗАКРЫТИЯ ======
  window.showCloseReasonModal = function(orderId) {
    currentOrderId = orderId;
    const modal = document.getElementById('closeReasonModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  };

  window.hideCloseReasonModal = function() {
    const modal = document.getElementById('closeReasonModal');
    if (modal) modal.style.display = 'none';
    currentOrderId = null;
  };

  // ====== ОБРАБОТКА ПРИЧИНЫ ======
  window.handleCloseReason = async function(reason) {
    if (!currentOrderId) return;
    
    if (reason === 'not_actual') {
      await closeOrderAsNotActual(currentOrderId);
    } else if (reason === 'agreed') {
      await showMasterSelection(currentOrderId);
    }
  };

  // ====== ЗАКРЫТИЕ ЗАКАЗА КАК НЕАКТУАЛЬНОГО ======
  async function closeOrderAsNotActual(orderId) {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        alert('Войдите в систему');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.message || 'Ошибка закрытия заказа');

      window.hideCloseReasonModal();
      window.closeOrderDetails();
      showThanksModal('Спасибо, ждем Вас снова!');

      if (typeof window.loadClientOrders === 'function') {
        setTimeout(() => window.loadClientOrders(), 500);
      }
      if (typeof window.loadArchivedOrders === 'function') {
        setTimeout(() => window.loadArchivedOrders(), 700);
      }

    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка: ' + error.message);
    }
  }

  // ====== ВЫБОР МАСТЕРА ======
  async function showMasterSelection(orderId) {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        alert('Войдите в систему');
        return;
      }

      // Получаем данные заказа
      const orderRes = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderResult = await orderRes.json();
      if (!orderResult.success) throw new Error(orderResult.message);
      const order = orderResult.data;

      // Получаем город заказчика
      const userJson = localStorage.getItem('user') || localStorage.getItem('remont_user');
      const user = JSON.parse(userJson);
      const city = user.city || '';

      // Ищем мастеров по городу и специализации из заказа
      let url = `/api/users/masters?city=${encodeURIComponent(city)}`;
      if (order.category) {
        url += `&spec=${order.category}`;
      }

      console.log('🔍 Поиск мастеров по URL:', url);

      const mastersRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mastersResult = await mastersRes.json();
      if (!mastersResult.success) throw new Error(mastersResult.message);

      currentMasters = mastersResult.data || [];
      currentOrderId = orderId;

      console.log('📋 Найдено мастеров:', currentMasters.length);

      showMasterSelectModal(currentMasters);

    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка: ' + error.message);
    }
  }

  // ====== МОДАЛКА ВЫБОРА МАСТЕРА ======
  function showMasterSelectModal(masters) {
    const modal = document.getElementById('masterSelectModal');
    const list = document.getElementById('masterSelectList');
    if (!modal || !list) return;

    if (!masters || masters.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#666;">Нет доступных мастеров в вашем городе по этой специализации</p>';
    } else {
      let html = '';
      masters.forEach(master => {
        html += `
          <button class="master-select-btn" data-id="${master.id}" data-name="${master.name}">
            <div class="master-avatar">${(master.name || 'М').charAt(0).toUpperCase()}</div>
            <div class="master-info">
              <strong>${master.name}</strong>
              <span>⭐ ${master.rating || 0} (${master.reviewsCount || 0} отзывов)</span>
              <span style="font-size:12px;color:#94a3b8;">${master.city || 'Город не указан'}</span>
            </div>
          </button>
        `;
      });
      list.innerHTML = html;

      list.querySelectorAll('.master-select-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const masterId = this.dataset.id;
          const masterName = this.dataset.name;
          assignMasterToOrder(currentOrderId, masterId, masterName);
        });
      });
    }

    modal.style.display = 'flex';
  }

  window.hideMasterSelectModal = function() {
    const modal = document.getElementById('masterSelectModal');
    if (modal) modal.style.display = 'none';
    currentOrderId = null;
  };

  // ====== НАЗНАЧЕНИЕ МАСТЕРА ======
  async function assignMasterToOrder(orderId, masterId, masterName) {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        alert('Войдите в систему');
        return;
      }

      // Получаем данные мастера для имени
      const masterRes = await fetch(`/api/users/${masterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const masterData = await masterRes.json();
      const master = masterData.user || masterData.data || { name: masterName };

      // Назначаем мастера на заказ
      const response = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ masterId: parseInt(masterId) })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Ошибка назначения мастера');
      }

      // Закрываем все модалки
      window.hideMasterSelectModal();
      window.hideCloseReasonModal();
      window.closeOrderDetails();
      
      // Показываем благодарность
      showThanksModal(`Спасибо! Вы выбрали мастера ${master.name || masterName}. Заказ передан в работу.`);

      // Обновляем список заказов
      if (typeof window.loadClientOrders === 'function') {
        setTimeout(() => window.loadClientOrders(), 500);
      }

    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка: ' + error.message);
    }
  }

  // ====== МОДАЛКА БЛАГОДАРНОСТИ ======
  function showThanksModal(message) {
    const modal = document.getElementById('thanksModal');
    const text = document.getElementById('thanksModalText');
    if (!modal || !text) return;

    text.textContent = message;
    modal.style.display = 'flex';
  }

  window.hideThanksModal = function() {
    const modal = document.getElementById('thanksModal');
    if (modal) modal.style.display = 'none';
    
    const closeReasonModal = document.getElementById('closeReasonModal');
    if (closeReasonModal) closeReasonModal.style.display = 'none';
    
    const masterSelectModal = document.getElementById('masterSelectModal');
    if (masterSelectModal) masterSelectModal.style.display = 'none';
    
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (orderDetailsModal) orderDetailsModal.style.display = 'none';
    
    currentOrderId = null;
  };

  console.log("✅ order-actions.js инициализирован");
})();
