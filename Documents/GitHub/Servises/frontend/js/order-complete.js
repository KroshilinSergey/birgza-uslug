// order-complete.js - автономный модуль подтверждения выполнения заказа
(function() {
  console.log("🔧 order-complete.js загружен");

  let currentOrderId = null;
  let currentMasterId = null;
  let currentMasterName = '';

  // ====== ОТКРЫТИЕ МОДАЛКИ ПОДТВЕРЖДЕНИЯ ======
  window.showCompleteConfirmModal = function(orderId, masterId, masterName) {
    currentOrderId = orderId;
    currentMasterId = masterId;
    currentMasterName = masterName || 'Мастер';
    
    const modal = document.getElementById('completeConfirmModal');
    const text = document.getElementById('completeConfirmText');
    if (modal && text) {
      text.textContent = `Мастер ${currentMasterName} выполнил ваш заказ. Просим оценить его работу, это поможет другим заказчикам в выборе исполнителя.`;
      modal.style.display = 'flex';
    }
  };

  window.hideCompleteConfirmModal = function() {
    const modal = document.getElementById('completeConfirmModal');
    if (modal) modal.style.display = 'none';
  };

  // ====== ОБРАБОТКА "ОЦЕНИТЬ МАСТЕРА" ======
  window.showReviewForm = function() {
    window.hideCompleteConfirmModal();
    const modal = document.getElementById('reviewModal');
    if (modal) {
      document.querySelectorAll('#reviewModal input[name="reviewRating"]').forEach(r => r.checked = false);
      document.getElementById('reviewComment').value = '';
      document.getElementById('reviewMasterName').textContent = currentMasterName;
      modal.style.display = 'flex';
    }
  };

  // ====== ОБРАБОТКА "В ДРУГОЙ РАЗ" ======
  window.completeOrderWithoutReview = async function() {
    window.hideCompleteConfirmModal();
    await completeOrder(currentOrderId);
  };

  // ====== ОТПРАВКА ОТЗЫВА ======
  window.submitReview = async function() {
    const ratingInput = document.querySelector('#reviewModal input[name="reviewRating"]:checked');
    if (!ratingInput) {
      alert('Пожалуйста, поставьте оценку мастеру');
      return;
    }
    
    const rating = parseInt(ratingInput.value);
    const comment = document.getElementById('reviewComment').value.trim();
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        alert('Войдите в систему');
        return;
      }

      // Сначала завершаем заказ
      await completeOrder(currentOrderId);

      // Затем отправляем отзыв
      const reviewResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: currentOrderId,
          rating: rating,
          comment: comment,
          pros: [],
          cons: [],
          photos: []
        })
      });

      const reviewResult = await reviewResponse.json();
      if (!reviewResponse.ok) {
        if (reviewResponse.status === 400 && reviewResult.message && reviewResult.message.includes('уже существует')) {
          window.hideReviewModal();
          showThanksModal('Заказ завершен! Отзыв уже был оставлен ранее.');
          return;
        }
        throw new Error(reviewResult.message || 'Ошибка отправки отзыва');
      }

      window.hideReviewModal();
      showThanksModal('Спасибо за отзыв! Ваша оценка поможет другим заказчикам.');

    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка: ' + error.message);
    }
  };

  // ====== ЗАВЕРШЕНИЕ ЗАКАЗА (КЛИЕНТ) ======
  async function completeOrder(orderId) {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        alert('Войдите в систему');
        return;
      }

      // Используем новый эндпоинт для клиента
      const endpoint = `/api/orders/${orderId}/complete-by-client`;
      
      console.log('📤 Отправка запроса на завершение заказа клиентом:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Ошибка завершения заказа');

      console.log('✅ Заказ завершен:', result);
      
      // Обновляем списки заказов
      if (typeof window.loadClientOrders === 'function') {
        setTimeout(() => window.loadClientOrders(), 500);
      }
      if (typeof window.loadArchivedOrders === 'function') {
        setTimeout(() => window.loadArchivedOrders(), 700);
      }
      
      // Закрываем модалку деталей
      window.closeOrderDetails();

      return result;

    } catch (error) {
      console.error('Ошибка завершения заказа:', error);
      throw error;
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
    
    const completeConfirmModal = document.getElementById('completeConfirmModal');
    if (completeConfirmModal) completeConfirmModal.style.display = 'none';
    
    const reviewModal = document.getElementById('reviewModal');
    if (reviewModal) reviewModal.style.display = 'none';
    
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (orderDetailsModal) orderDetailsModal.style.display = 'none';
    
    // Обновляем списки заказов
    if (typeof window.loadClientOrders === 'function') {
      setTimeout(() => window.loadClientOrders(), 500);
    }
    if (typeof window.loadArchivedOrders === 'function') {
      setTimeout(() => window.loadArchivedOrders(), 700);
    }
  };

  // ====== ЗАКРЫТИЕ МОДАЛКИ ОТЗЫВА ======
  window.hideReviewModal = function() {
    const modal = document.getElementById('reviewModal');
    if (modal) modal.style.display = 'none';
  };

  // ====== ОТКРЫТИЕ ПОДТВЕРЖДЕНИЯ ======
  window.openCompleteConfirm = function(orderId) {
    const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
    if (!token) {
      alert('Войдите в систему');
      return;
    }

    fetch(`/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(result => {
      if (!result.success) throw new Error(result.message);
      const order = result.data;
      if (order.status !== 'in_progress') {
        alert('Заказ не в работе');
        return;
      }
      const masterName = order.masterName || 'Мастер';
      const masterId = order.masterId;
      currentMasterName = masterName;
      window.showCompleteConfirmModal(orderId, masterId, masterName);
    })
    .catch(error => {
      console.error('Ошибка:', error);
      alert('Ошибка: ' + error.message);
    });
  };

  console.log("✅ order-complete.js инициализирован");
})();
