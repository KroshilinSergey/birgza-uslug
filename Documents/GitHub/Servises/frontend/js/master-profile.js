// master-profile.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
class MasterProfileNew {
  constructor() {
    this.currentMaster = null;
    this.isEditMode = false;
    this.tempPhoto = null;
    console.log("✅ MasterProfileNew создан");
  }

  init(user) {
    this.currentMaster = user;
    this.initProfileData();
    this.setupEventListeners(); // Добавляем настройку обработчиков
    console.log("✅ MasterProfileNew инициализирован");
  }

  initProfileData() {
    if (!this.currentMaster.profile) {
      this.currentMaster.profile = {
        photo: null,
        about: "",
        education: "",
        achievements: "",
        strengths: "",
        preferredOrders: "",
        experience: this.currentMaster.experience || 0,
        city: this.currentMaster.city || "",
        specializations: this.currentMaster.specializations || [],
        availability: {
          days: [],
          workHours: { start: "09:00", end: "18:00" },
        },
        districts: "",
      };
    }
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    console.log("🔧 Настройка обработчиков анкеты");

    // Кнопка редактирования
    const editBtn = document.getElementById("profileEditBtn");
    if (editBtn) {
      // Удаляем старые обработчики
      editBtn.removeEventListener("click", this.switchToEditMode.bind(this));
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("✏️ Клик по кнопке редактирования");
        this.switchToEditMode();
      });
      console.log("✅ Обработчик на кнопку редактирования");
    }

    // Кнопка закрытия
    const closeBtn = document.getElementById("closeProfileModalBtn");
    if (closeBtn) {
      closeBtn.removeEventListener("click", this.closeModal.bind(this));
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("❌ Клик по кнопке закрытия");
        this.closeModal();
      });
    }

    // Кнопка отмены
    const cancelBtn = document.getElementById("cancelProfileBtn");
    if (cancelBtn) {
      cancelBtn.removeEventListener("click", this.cancelEdit.bind(this));
      cancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("❌ Клик по кнопке отмены");
        this.cancelEdit();
      });
    }

    // Форма сохранения
    const form = document.getElementById("profileForm");
    if (form) {
      form.removeEventListener("submit", this.saveProfile.bind(this));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("💾 Сабмит формы");
        this.saveProfile();
      });
    }

    // Загрузка фото
    const photoInput = document.getElementById("profilePhotoInputGlobal");
    if (photoInput) {
      photoInput.removeEventListener(
        "change",
        this.handlePhotoUpload.bind(this),
      );
      photoInput.addEventListener("change", (e) => {
        console.log("📸 Выбрано фото");
        this.handlePhotoUpload(e);
      });
    }
  }

  openModal() {
    console.log("📋 Открытие анкеты");
    const modal = document.getElementById("profileModal");
    if (!modal) {
      console.error("❌ Модальное окно profileModal не найдено");
      alert("Ошибка: окно анкеты не найдено");
      return;
    }

    // Убеждаемся, что currentMaster актуален
    const userJson = localStorage.getItem("remont_user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentMaster = user;
        this.initProfileData();
      } catch (e) {
        console.error("Ошибка загрузки пользователя:", e);
      }
    }

    this.loadProfileData();
    this.switchToViewMode();
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    console.log("❌ Закрытие анкеты");
    const modal = document.getElementById("profileModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
    this.tempPhoto = null;
  }

  cancelEdit() {
    console.log("❌ Отмена редактирования");
    this.switchToViewMode();
    this.closeModal();
  }

  switchToViewMode() {
    console.log("👁️ Переключение в режим просмотра");
    const viewMode = document.getElementById("profileViewMode");
    const editMode = document.getElementById("profileEditMode");

    if (viewMode) viewMode.style.display = "block";
    if (editMode) editMode.style.display = "none";

    this.loadProfileData();
  }

  switchToEditMode() {
    console.log("✏️ Переключение в режим редактирования");
    try {
      const viewMode = document.getElementById("profileViewMode");
      const editMode = document.getElementById("profileEditMode");

      if (viewMode) viewMode.style.display = "none";
      if (editMode) editMode.style.display = "block";

      this.loadEditFormData();
    } catch (e) {
      console.error("❌ Ошибка при переключении в режим редактирования:", e);
      alert("Не удалось открыть форму редактирования.");
    }
  }

  loadProfileData() {
    if (!this.currentMaster) {
      console.error("❌ Нет данных мастера");
      return;
    }

    console.log("📋 Загрузка данных анкеты");
    const profile = this.currentMaster.profile || {};

    const nameEl = document.getElementById("profileName");
    if (nameEl) nameEl.textContent = this.currentMaster.name || "Мастер";

    const avatarEl = document.getElementById("profileAvatar");
    if (avatarEl) {
      avatarEl.textContent = (this.currentMaster.name || "М")
        .charAt(0)
        .toUpperCase();
    }

    const rating = parseFloat(this.currentMaster.rating) || 0;
    const starsEl = document.getElementById("profileStars");
    if (starsEl) starsEl.textContent = this.getStars(rating);

    const reviewsEl = document.getElementById("profileReviewsCount");
    if (reviewsEl) {
      reviewsEl.textContent = `${this.currentMaster.reviewsCount || 0} ${this.getReviewWord(this.currentMaster.reviewsCount || 0)}`;
    }

    this.updatePhotoPreview();

    const aboutEl = document.getElementById("viewAbout");
    if (aboutEl) {
      aboutEl.innerHTML =
        profile.about ||
        '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Добавьте информацию о себе</span>';
    }

    const eduEl = document.getElementById("viewEducation");
    if (eduEl) {
      eduEl.innerHTML =
        profile.education ||
        '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Добавьте образование</span>';
    }

    const achEl = document.getElementById("viewAchievements");
    if (achEl) {
      achEl.innerHTML =
        profile.achievements ||
        '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Добавьте достижения</span>';
    }

    const strengthsEl = document.getElementById("viewStrengths");
    if (strengthsEl) {
      strengthsEl.innerHTML =
        profile.strengths ||
        '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Укажите ваши сильные стороны</span>';
    }

    const prefEl = document.getElementById("viewPreferredOrders");
    if (prefEl) {
      prefEl.innerHTML =
        profile.preferredOrders ||
        '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Укажите, какие заказы предпочитаете</span>';
    }

    const expEl = document.getElementById("viewExperience");
    if (expEl) {
      expEl.innerHTML = `${profile.experience || 0} ${this.getYearWord(profile.experience || 0)}`;
    }

    const cityEl = document.getElementById("viewCity");
    if (cityEl) {
      cityEl.innerHTML = profile.city || this.currentMaster.city || "Не указан";
    }

    const specsEl = document.getElementById("viewSpecializations");
    if (specsEl) {
      const specs = profile.specializations || [];
      if (specs.length > 0) {
        try {
          if (window.Categories && Array.isArray(window.Categories)) {
            const catMap = {};
            window.Categories.forEach((c) => (catMap[c.value] = c));
            const html = specs
              .map((id) => {
                const cat = catMap[id];
                if (cat) {
                  return `<span class="profile-tag"><i class="fas ${cat.icon || "fa-wrench"}"></i> ${cat.label}</span>`;
                } else {
                  return `<span class="profile-tag"><i class="fas fa-question"></i> ${id}</span>`;
                }
              })
              .join("");
            specsEl.innerHTML = html;
          } else {
            specsEl.innerHTML =
              '<span class="profile-error">Ошибка загрузки категорий</span>';
          }
        } catch (e) {
          console.error("Ошибка при отображении специализаций:", e);
          specsEl.innerHTML =
            '<span class="profile-error">Ошибка загрузки специализаций</span>';
        }
      } else {
        specsEl.innerHTML =
          '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Выберите специализации</span>';
      }
    }

    const availEl = document.getElementById("viewAvailability");
    if (availEl) {
      if (profile.availability?.days?.length > 0) {
        let html = `<div>${this.getDaysString(profile.availability.days)}</div>`;
        if (profile.availability.workHours) {
          html += `<div><i class="far fa-clock"></i> ${profile.availability.workHours.start} – ${profile.availability.workHours.end}</div>`;
        }
        availEl.innerHTML = html;
      } else {
        availEl.innerHTML =
          '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Укажите время доступности</span>';
      }
    }

    const districtsEl = document.getElementById("viewDistricts");
    if (districtsEl) {
      districtsEl.innerHTML =
        profile.districts ||
        '<span class="profile-empty-field"><i class="fas fa-plus-circle"></i> Укажите районы выезда</span>';
    }
  }

  loadEditFormData() {
    if (!this.currentMaster) return;
    console.log("📝 Загрузка данных в форму");

    const profile = this.currentMaster.profile || {};

    this.setValue("editName", this.currentMaster.name || "");
    this.setValue("editAbout", profile.about || "");
    this.setValue("editEducation", profile.education || "");
    this.setValue("editAchievements", profile.achievements || "");
    this.setValue("editStrengths", profile.strengths || "");
    this.setValue("editPreferredOrders", profile.preferredOrders || "");
    this.setValue("editExperience", profile.experience || 0);
    this.setValue("editCity", profile.city || this.currentMaster.city || "");
    this.setValue("editDistricts", profile.districts || "");

    const selectedDays = profile.availability?.days || [];
    document.querySelectorAll('input[name="workDays"]').forEach((cb) => {
      cb.checked = selectedDays.includes(cb.value);
    });

    if (profile.availability?.workHours) {
      this.setValue(
        "workStartTime",
        profile.availability.workHours.start || "09:00",
      );
      this.setValue(
        "workEndTime",
        profile.availability.workHours.end || "18:00",
      );
    }

    this.loadSpecializations();
  }

  setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  async loadSpecializations() {
    const container = document.getElementById("editSpecializationsGrid");
    if (!container) return;

    let categories = window.Categories;
    if (!categories || categories.length === 0) {
      try {
        const catResult = await apiRequest("GET", "/categories", null, false);
        categories = catResult.data.map((c) => ({
          value: c._id,
          label: c.name,
          icon: c.icon,
          parentCategory: c.parentCategory,
        }));
        window.Categories = categories;
      } catch (error) {
        console.error("Ошибка загрузки категорий:", error);
        container.innerHTML =
          '<p class="error">Ошибка загрузки специализаций</p>';
        return;
      }
    }

    const userSpecs = this.currentMaster?.specializations || [];

    // Группировка
    const rootItems = [];
    const childrenByParent = {};
    categories.forEach((cat) => {
      if (!cat.parentCategory) {
        rootItems.push(cat);
      } else {
        const parentId = cat.parentCategory._id || cat.parentCategory;
        if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
        childrenByParent[parentId].push(cat);
      }
    });

    container.innerHTML = "";

    // Корневые (кроме «Ремонт и строительство»)
    rootItems.forEach((cat) => {
      if (cat.label === "Ремонт и строительство") return;
      const div = document.createElement("div");
      div.className = "specialization-checkbox";
      div.innerHTML = `
      <input type="checkbox" id="spec_${cat.value}" name="edit_specializations" value="${cat.value}" ${userSpecs.includes(cat.value) ? "checked" : ""}>
      <label for="spec_${cat.value}"><i class="fas ${cat.icon || "fa-wrench"}"></i> ${cat.label}</label>
    `;
      container.appendChild(div);
    });

    // Группа «Ремонт и строительство»
    const parentCat = rootItems.find(
      (c) => c.label === "Ремонт и строительство",
    );
    if (parentCat && childrenByParent[parentCat.value]) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "category-group";

      const header = document.createElement("div");
      header.className = "category-group-header";
      header.innerHTML = `<span>Ремонт и строительство</span><i class="fas fa-chevron-right"></i>`;

      const content = document.createElement("div");
      content.className = "category-group-content";

      childrenByParent[parentCat.value].forEach((child) => {
        const div = document.createElement("div");
        div.className = "specialization-checkbox";
        div.innerHTML = `
        <input type="checkbox" id="spec_${child.value}" name="edit_specializations" value="${child.value}" ${userSpecs.includes(child.value) ? "checked" : ""}>
        <label for="spec_${child.value}"><i class="fas ${child.icon || "fa-wrench"}"></i> ${child.label}</label>
      `;
        content.appendChild(div);
      });

      header.addEventListener("click", () => {
        header.classList.toggle("open");
        content.classList.toggle("open");
      });

      groupDiv.appendChild(header);
      groupDiv.appendChild(content);
      container.appendChild(groupDiv);
    }
  }

  updatePhotoPreview() {
    const previewEl = document.getElementById("profilePhotoPreview");
    const previewEditEl = document.getElementById("profilePhotoPreviewEdit");
    const profile = this.currentMaster?.profile || {};
    const photoToShow = this.tempPhoto || profile.photo || null;

    if (photoToShow) {
      const imgHtml = `<img src="${photoToShow}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
      if (previewEl) previewEl.innerHTML = imgHtml;
      if (previewEditEl) previewEditEl.innerHTML = imgHtml;
    } else {
      if (previewEl) previewEl.innerHTML = '<i class="fas fa-user"></i>';
      if (previewEditEl)
        previewEditEl.innerHTML = '<i class="fas fa-user"></i>';
    }
  }

  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log("📸 Загрузка фото:", file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.tempPhoto = e.target.result;
      this.updatePhotoPreview();

      const avatarEl = document.getElementById("userAvatar");
      if (avatarEl) {
        avatarEl.innerHTML = "";
        avatarEl.style.backgroundImage = `url('${e.target.result}')`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
      }
      this.showNotification("✅ Фото загружено");
    };
    reader.readAsDataURL(file);
  }

  async saveProfile() {
    if (!this.currentMaster) {
      this.showNotification("❌ Ошибка: нет данных мастера");
      return;
    }

    console.log("💾 Сохранение анкеты", this.currentMaster);

    if (this.tempPhoto) {
      this.currentMaster.profile.photo = this.tempPhoto;
    }

    this.currentMaster.profile.about = this.getValue("editAbout");
    this.currentMaster.profile.education = this.getValue("editEducation");
    this.currentMaster.profile.achievements = this.getValue("editAchievements");
    this.currentMaster.profile.strengths = this.getValue("editStrengths");
    this.currentMaster.profile.preferredOrders = this.getValue(
      "editPreferredOrders",
    );
    this.currentMaster.profile.experience =
      parseInt(this.getValue("editExperience")) || 0;
    this.currentMaster.profile.city = this.getValue("editCity");
    this.currentMaster.profile.districts = this.getValue("editDistricts");

    const newName = this.getValue("editName");
    if (newName) this.currentMaster.name = newName;

    this.currentMaster.city = this.currentMaster.profile.city;
    this.currentMaster.experience =
      parseInt(this.getValue("editExperience")) || 0;

    this.currentMaster.profile.availability = {
      days: Array.from(
        document.querySelectorAll('input[name="workDays"]:checked'),
      ).map((cb) => cb.value),
      workHours: {
        start: this.getValue("workStartTime") || "09:00",
        end: this.getValue("workEndTime") || "18:00",
      },
    };

    const selectedSpecs = Array.from(
      document.querySelectorAll('input[name="edit_specializations"]:checked'),
    ).map((cb) => cb.value);
    this.currentMaster.specializations = selectedSpecs;
    this.currentMaster.profile.specializations = selectedSpecs;

    console.log("📤 Отправляемые данные:", {
      name: this.currentMaster.name,
      city: this.currentMaster.city,
      specializations: this.currentMaster.specializations,
      experience: this.currentMaster.experience,
      profile: this.currentMaster.profile,
    });

    try {
      const response = await apiRequest("PUT", "/users/profile", {
        name: this.currentMaster.name,
        city: this.currentMaster.city,
        specializations: this.currentMaster.specializations,
        experience: this.currentMaster.experience,
        profile: this.currentMaster.profile,
      });

      console.log("📥 Ответ сервера:", response);

      if (response.success) {
        // Обновляем данные пользователя
        const meResult = await apiRequest("GET", "/auth/me");
        this.currentMaster = meResult.user;
        localStorage.setItem("remont_user", JSON.stringify(meResult.user));

        // Обновляем отображение специализаций на главной
        const specsGrid = document.getElementById("rightSpecializationsGrid");
        if (specsGrid) {
          await loadSpecializationsAndRender(
            this.currentMaster.specializations || [],
            specsGrid,
          );
        }

        // Обновляем имя
        const nameEl = document.getElementById("userName");
        const welcomeEl = document.getElementById("welcomeName");
        if (nameEl) nameEl.textContent = this.currentMaster.name;
        if (welcomeEl) welcomeEl.textContent = this.currentMaster.name;

        this.showNotification("✅ Анкета успешно сохранена!");
        this.closeModal();
      } else {
        this.showNotification(
          "❌ Ошибка при сохранении: " +
            (response.message || "Неизвестная ошибка"),
        );
      }
    } catch (error) {
      console.error("❌ Ошибка отправки на сервер:", error);
      this.showNotification(
        "❌ Не удалось сохранить на сервере: " +
          (error.message || "Неизвестная ошибка"),
      );
    }
  }

  updateUI() {
    if (!this.currentMaster) return;

    const nameEl = document.getElementById("userName");
    const welcomeEl = document.getElementById("welcomeName");
    if (nameEl) nameEl.textContent = this.currentMaster.name || "Мастер";
    if (welcomeEl) welcomeEl.textContent = this.currentMaster.name || "Мастер";

    const avatarEl = document.getElementById("userAvatar");
    if (avatarEl) {
      if (this.currentMaster.profile?.photo) {
        avatarEl.innerHTML = "";
        avatarEl.style.backgroundImage = `url('${this.currentMaster.profile.photo}')`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
      } else {
        avatarEl.style.backgroundImage = "";
        avatarEl.style.background =
          "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)";
        avatarEl.textContent = (this.currentMaster.name || "М")
          .charAt(0)
          .toUpperCase();
      }
    }

    const specsGrid = document.getElementById("rightSpecializationsGrid");
    if (specsGrid) {
      specsGrid.innerHTML = "";
      const specs = this.currentMaster.specializations || [];
      if (specs.length === 0) {
        specsGrid.innerHTML =
          '<p class="no-specs">Специализации не выбраны</p>';
      } else {
        if (window.Categories && Array.isArray(window.Categories)) {
          const catMap = {};
          window.Categories.forEach((c) => (catMap[c.value] = c));
          specs.forEach((id) => {
            const cat = catMap[id];
            if (cat) {
              const div = document.createElement("div");
              div.className = "specialization-card";
              div.innerHTML = `<i class="fas ${cat.icon || "fa-check-circle"}"></i><span>${cat.label}</span>`;
              specsGrid.appendChild(div);
            }
          });
        }
      }
    }
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #48bb78;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(72, 187, 120, 0.2);
      z-index: 9999;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  getStars(rating) {
    const full = Math.floor(rating);
    let stars = "";
    for (let i = 0; i < 5; i++) stars += i < full ? "★" : "☆";
    return stars;
  }

  getReviewWord(count) {
    if (!count) return "отзывов";
    count = parseInt(count);
    if (count % 10 === 1 && count % 100 !== 11) return "отзыв";
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100))
      return "отзыва";
    return "отзывов";
  }

  getYearWord(years) {
    if (!years) return "лет";
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "лет";
    if (lastDigit === 1) return "год";
    if (lastDigit >= 2 && lastDigit <= 4) return "года";
    return "лет";
  }

  getDaysString(days) {
    const daysMap = {
      monday: "Пн",
      tuesday: "Вт",
      wednesday: "Ср",
      thursday: "Чт",
      friday: "Пт",
      saturday: "Сб",
      sunday: "Вс",
    };
    if (days.length === 7) return "Ежедневно";
    if (
      days.includes("monday") &&
      days.includes("tuesday") &&
      days.includes("wednesday") &&
      days.includes("thursday") &&
      days.includes("friday") &&
      !days.includes("saturday") &&
      !days.includes("sunday")
    ) {
      return "Пн–Пт";
    }
    return days.map((d) => daysMap[d] || d).join(", ");
  }
}

// Создаем глобальный экземпляр
window.MasterProfileNew = new MasterProfileNew();
