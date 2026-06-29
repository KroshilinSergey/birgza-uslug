// phone-mask.js - маска для ввода телефона
(function() {
  console.log("🔧 phone-mask.js загружен");

  function applyPhoneMask(input) {
    if (!input) return;
    
    // Устанавливаем начальное значение
    if (!input.value || input.value === '') {
      input.value = '+7';
    }

    input.addEventListener('input', function(e) {
      let cursorPos = this.selectionStart;
      const oldLength = this.value.length;
      
      // Удаляем все кроме цифр и +
      let raw = this.value.replace(/[^0-9+]/g, '');
      
      // Если не начинается с +7, добавляем
      if (!raw.startsWith('+7')) {
        raw = '+7' + raw.replace(/\D/g, '');
      }
      
      // Берем только цифры после +7
      let digits = raw.replace(/\D/g, '');
      // Ограничиваем 11 цифрами
      if (digits.length > 11) {
        digits = digits.slice(0, 11);
      }
      
      // Форматируем: +7 (XXX) XXX-XX-XX
      let formatted = '+7';
      if (digits.length > 1) {
        let rest = digits.slice(1);
        if (rest.length > 0) {
          formatted += ' (';
          if (rest.length >= 3) {
            formatted += rest.slice(0, 3) + ') ';
            rest = rest.slice(3);
          } else {
            formatted += rest;
            rest = '';
          }
        }
        if (rest.length > 0) {
          if (rest.length >= 3) {
            formatted += rest.slice(0, 3);
            rest = rest.slice(3);
            if (rest.length > 0) {
              formatted += '-';
            }
          } else {
            formatted += rest;
            rest = '';
          }
        }
        if (rest.length > 0) {
          if (rest.length >= 2) {
            formatted += rest.slice(0, 2);
            rest = rest.slice(2);
            if (rest.length > 0) {
              formatted += '-';
            }
          } else {
            formatted += rest;
            rest = '';
          }
        }
        if (rest.length > 0) {
          formatted += rest.slice(0, 2);
        }
      }
      
      // Сохраняем позицию курсора
      const diff = formatted.length - oldLength;
      this.value = formatted;
      
      // Восстанавливаем позицию курсора
      if (cursorPos > 0) {
        let newPos = cursorPos + diff;
        if (newPos < 0) newPos = 0;
        if (newPos > formatted.length) newPos = formatted.length;
        this.setSelectionRange(newPos, newPos);
      }
      
      // Сохраняем чистый номер в атрибут
      const cleanDigits = digits.slice(1);
      if (cleanDigits.length > 0) {
        this.dataset.cleanPhone = '+7' + cleanDigits;
      } else {
        this.dataset.cleanPhone = '+7';
      }
    });

    // Запрещаем ввод не-цифр
    input.addEventListener('keydown', function(e) {
      const key = e.key;
      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
        return;
      }
      if (e.ctrlKey && ['c', 'v', 'x'].includes(key.toLowerCase())) {
        return;
      }
      if (!/^[0-9]$/.test(key)) {
        e.preventDefault();
      }
    });

    // Обработка вставки
    input.addEventListener('paste', function(e) {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const digits = pasted.replace(/\D/g, '');
      if (digits.length > 0) {
        // Очищаем поле от форматирования
        const clean = '+7' + digits.slice(0, 11);
        this.value = clean;
        const event = new Event('input', { bubbles: true });
        this.dispatchEvent(event);
      }
    });

    input.addEventListener('focus', function() {
      const len = this.value.length;
      this.setSelectionRange(len, len);
    });
  }

  function initPhoneMasks() {
    console.log("📱 Инициализация масок телефона");
    
    const selectors = [
      '#phone',
      '#registerPhone',
      '#orderPhone',
      '.phone-mask',
      'input[type="tel"]'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el && !el.dataset.masked) {
          el.dataset.masked = 'true';
          applyPhoneMask(el);
          console.log('✅ Маска применена к:', el.id || el.className);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhoneMasks);
  } else {
    initPhoneMasks();
  }

  window.getCleanPhone = function(input) {
    if (!input) return '+7';
    if (input.dataset.cleanPhone) {
      return input.dataset.cleanPhone;
    }
    const digits = input.value.replace(/\D/g, '');
    if (digits.length > 0) {
      return '+7' + digits.slice(1);
    }
    return '+7';
  };

})();
