// order-create.js - автономный модуль создания заказа
(function() {
  console.log("🔧 order-create.js загружен");

  // Загрузка категорий для формы
  async function loadCategoriesForOrder() {
    const container = document.getElementById('orderCategories');
    if (!container) return;
    
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success && result.data.length) {
        let html = '';
        result.data.forEach(cat => {
          html += `
            <label class="category-radio">
              <input type="radio" name="orderCategory" value="${cat.id}" data-name="${cat.name}">
              <span>${cat.icon || '🛠️'} ${cat.name}</span>
            </label>
          `;
        });
        container.innerHTML = html;
        
        container.querySelectorAll('input[name="orderCategory"]').forEach(radio => {
          radio.addEventListener('change', function() {
            document.getElementById('selectedCategory').value = this.value;
          });
        });
      } else {
        container.innerHTML = '<p class="error">Не удалось загрузить категории</p>';
      }
    } catch (e) {
      console.error('Ошибка загрузки категорий:', e);
      container.innerHTML = '<p class="error">Ошибка загрузки категорий</p>';
    }
  }

  // Открыть модалку
  window.openCreateOrderModal = async function() {
    const modal = document.getElementById('createOrderModal');
    if (!modal) return;
    
    const form = document.getElementById('createOrderForm');
    if (form) form.reset();
    document.getElementById('selectedCategory').value = '';
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    
    await loadCategoriesForOrder();
    modal.style.display = 'flex';
  };

  // Закрыть модалку
  window.hideCreateOrderModal = function() {
    const modal = document.getElementById('createOrderModal');
    if (modal) modal.style.display = 'none';
  };

  // Показать ошибку
  function showFormError(fieldId, message) {
    const oldError = document.getElementById(fieldId + 'Error');
    if (oldError) oldError.remove();
    
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const errorEl = document.createElement('div');
    errorEl.id = fieldId + 'Error';
    errorEl.className = 'form-error';
    errorEl.style.cssText = 'color:red;font-size:14px;margin-top:5px;';
    errorEl.textContent = message;
    field.parentNode.insertBefore(errorEl, field.nextSibling);
  }

  // Отправка формы
  async function submitCreateOrder(event) {
    event.preventDefault();
    
    const title = document.getElementById('orderTitle').value.trim();
    const description = document.getElementById('orderDescription').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const phoneVisible = document.getElementById('orderPhoneVisible').checked;
    const address = document.getElementById('orderAddress').value.trim();
    const categoryId = document.getElementById('selectedCategory').value;
    
    if (!title) return showFormError('orderTitle', 'Введите краткое описание задачи');
    if (!description) return showFormError('orderDescription', 'Введите подробное описание');
    if (!phone) return showFormError('orderPhone', 'Введите номер телефона');
    if (!categoryId) return showFormError('orderCategories', 'Выберите категорию работ');
    
    const catRadio = document.querySelector('input[name="orderCategory"]:checked');
    const categoryName = catRadio ? catRadio.getAttribute('data-name') : '';
    
    const orderData = {
      title,
      description,
      category: parseInt(categoryId),
      categoryName,
      phone,
      phoneVisible,
      address
    };
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('remont_token');
      if (!token) {
        alert('Войдите в систему');
        window.location.href = 'login.html';
        return;
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Ошибка создания заказа');
      }
      
      alert('✅ Заказ создан!');
      hideCreateOrderModal();
      
      // Обновляем список заказов
      if (typeof window.loadClientOrders === 'function') {
        window.loadClientOrders();
      } else {
        location.reload();
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('❌ Ошибка: ' + error.message);
    }
  }

  // Инициализация
  document.addEventListener('DOMContentLoaded', function() {
    // Кнопка "Создать заказ"
    const openBtn = document.getElementById('openCreateOrderBtn');
    if (openBtn) {
      openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.openCreateOrderModal();
      });
    }
    
    // Форма
    const form = document.getElementById('createOrderForm');
    if (form) {
      form.addEventListener('submit', submitCreateOrder);
    }
    
    // Кнопки закрытия
    document.querySelectorAll('#createOrderModal .close-modal, #createOrderModal .btn-secondary').forEach(btn => {
      btn.addEventListener('click', function(e) {
        if (this.classList.contains('close-modal') || this.textContent.trim() === 'Отмена') {
          e.preventDefault();
          window.hideCreateOrderModal();
        }
      });
    });
  });
})();
