// city-sync.js - Объединённый менеджер города с синхронизацией между вкладками
(function () {
  "use strict";

  class CityManager {
    constructor() {
      this.currentCity = null;
      this.currentCityData = null;
      this.listeners = [];
      this.isInitialized = false;

      this.init();
    }

    init() {
      if (this.isInitialized) return;

      console.log("CityManager: Инициализация...");
      this.loadCity();
      this.setupEventListeners();
      this.updateDisplay();
      this.isInitialized = true;

      document.addEventListener("DOMContentLoaded", () => {
        console.log("CityManager: DOM загружен, обновляем отображение");
        this.updateDisplay();
      });
    }

    loadCity() {
      const userJson = localStorage.getItem("remont_user");
      let city = localStorage.getItem("remont_city");
      let cityData = null;

      // 1. Пробуем загрузить из профиля пользователя
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.city) {
            city = user.city;
            if (user.cityData) {
              cityData =
                typeof user.cityData === "string"
                  ? JSON.parse(user.cityData)
                  : user.cityData;
            }
          }
        } catch (e) {
          console.error("CityManager: Ошибка загрузки города из профиля:", e);
        }
      }

      // 2. Пробуем загрузить из cityData
      if (!cityData) {
        const cityDataJson = localStorage.getItem("remont_city_data");
        if (cityDataJson) {
          try {
            cityData = JSON.parse(cityDataJson);
          } catch (e) {
            console.error("CityManager: Ошибка парсинга cityData:", e);
          }
        }
      }

      // 3. Если нет города - ставим заглушку
      if (!city) {
        city = "Выберите город";
      }

      // 4. Определяем чистое название
      const pureName = city.split(",")[0].trim();

      // 5. Создаём или обновляем cityData, чтобы поле name было чистым
      if (!cityData) {
        cityData = { name: pureName, fullName: city };
      } else {
        cityData.name = pureName;
        cityData.fullName = city;
      }

      this.currentCity = city;
      this.currentCityData = cityData;

      console.log("CityManager: Город загружен, чистое имя:", pureName);
      return { city, cityData };
    }

    setCity(cityName, cityData = null) {
      console.log("CityManager: Установка города", cityName);

      const pureName = cityName.split(",")[0].trim();

      if (cityData) {
        cityData.name = pureName;
        cityData.fullName = cityName;
      } else {
        cityData = { name: pureName, fullName: cityName };
      }

      this.currentCity = cityName;
      this.currentCityData = cityData;

      localStorage.setItem("remont_city", cityName);
      localStorage.setItem("city", cityName);
      localStorage.setItem("remont_city_pure", pureName);
      localStorage.setItem("remont_city_data", JSON.stringify(cityData));

      this.updateUserCity(cityName, cityData);
      this.updateDisplay();
      this.notifyListeners();
      this.syncWithOtherTabs();
      this.emitCityChanged();

      return true;
    }

    updateUserCity(cityName, cityData = null) {
      const userJson = localStorage.getItem("remont_user");
      if (!userJson) return;

      try {
        const user = JSON.parse(userJson);
        user.city = cityName;
        user.cityData = cityData || {
          name: cityName.split(",")[0].trim(),
          fullName: cityName,
        };
        user.updatedAt = new Date().toISOString();

        localStorage.setItem("remont_user", JSON.stringify(user));
        this.updateUserInAllUsers(user);
      } catch (e) {
        console.error("CityManager: Ошибка обновления города в профиле:", e);
      }
    }

    updateUserInAllUsers(updatedUser) {
      try {
        let allUsers = JSON.parse(localStorage.getItem("remont_users") || "[]");
        const index = allUsers.findIndex((user) => user.id === updatedUser.id);
        if (index !== -1) {
          allUsers[index] = updatedUser;
          localStorage.setItem("remont_users", JSON.stringify(allUsers));
        }
      } catch (e) {
        console.error(
          "CityManager: Ошибка обновления списка пользователей:",
          e,
        );
      }
    }

    updateDisplay() {
      const displayName =
        this.currentCityData?.name ||
        this.currentCity?.split(",")[0].trim() ||
        "Город не выбран";

      document.querySelectorAll(".city-display").forEach((el) => {
        el.textContent = displayName;
      });

      const elementsToUpdate = [
        "cityName",
        "currentCity",
        "headerCity",
        "userCity",
        "selectedCity",
        "cabinetCity",
      ];

      elementsToUpdate.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = displayName;
      });

      document.querySelectorAll("[data-city-display]").forEach((el) => {
        el.textContent = displayName;
      });
    }

    addListener(callback) {
      this.listeners.push(callback);
    }

    notifyListeners() {
      this.listeners.forEach((callback) => {
        try {
          callback(this.currentCity, this.currentCityData);
        } catch (e) {
          console.error("CityManager: Ошибка в слушателе:", e);
        }
      });
    }

    syncWithOtherTabs() {
      try {
        window.postMessage(
          {
            type: "CITY_UPDATED",
            city: this.currentCity,
            cityData: this.currentCityData,
            timestamp: Date.now(),
            source: window.location.href,
          },
          "*",
        );
      } catch (e) {
        console.error("CityManager: Ошибка отправки сообщения:", e);
      }

      try {
        const event = new StorageEvent("storage", {
          key: "remont_city",
          newValue: this.currentCity,
          oldValue: localStorage.getItem("remont_city"),
          url: window.location.href,
          storageArea: localStorage,
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error("CityManager: Ошибка генерации storage события:", e);
      }
    }

    emitCityChanged() {
      try {
        const event = new CustomEvent("citychanged", {
          detail: {
            city: this.currentCity,
            cityData: this.currentCityData,
          },
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error("CityManager: Ошибка генерации citychanged события:", e);
      }
    }

    setupEventListeners() {
      window.addEventListener("storage", (e) => {
        if (e.key === "remont_city" || e.key === "remont_user") {
          console.log(
            "CityManager: Обнаружено изменение в localStorage",
            e.key,
          );
          this.loadCity();
          this.updateDisplay();
          this.notifyListeners();
          this.emitCityChanged();
        }
      });

      window.addEventListener("message", (e) => {
        if (
          e.data &&
          e.data.type === "CITY_UPDATED" &&
          e.data.source !== window.location.href
        ) {
          console.log(
            "CityManager: Получено сообщение об обновлении города",
            e.data.city,
          );
          this.setCity(e.data.city, e.data.cityData);
        }
      });

      window.addEventListener("citychanged", (e) => {
        if (e.detail && e.detail.city !== this.currentCity) {
          console.log(
            "CityManager: Обнаружено событие citychanged",
            e.detail.city,
          );
          this.currentCity = e.detail.city;
          this.currentCityData = e.detail.cityData;
          this.updateDisplay();
          this.notifyListeners();
        }
      });
    }

    getCity() {
      return {
        name: this.currentCity,
        data: this.currentCityData,
      };
    }

    formatCityName(cityData) {
      if (!cityData) return this.currentCityData?.name || this.currentCity;

      if (typeof cityData === "string") {
        return cityData.split(",")[0].trim();
      } else if (cityData.name) {
        return cityData.name.split(",")[0].trim();
      }
      return this.currentCityData?.name || this.currentCity;
    }

    update(cityName, cityData = null) {
      return this.setCity(cityName, cityData);
    }
  }

  const cityManager = new CityManager();
  window.CityManager = cityManager;

  // Совместимость со старым кодом
  window.CitySync = {
    init: function () {
      console.log("CitySync.init вызван (для совместимости)");
    },
    updateCity: function (cityName, cityData) {
      return window.CityManager.setCity(cityName, cityData);
    },
    loadCurrentCity: function () {
      return window.CityManager.loadCity();
    },
    onCityChanged: function () {
      window.CityManager.loadCity();
      window.CityManager.updateDisplay();
    },
    emitCityChanged: function () {
      window.CityManager.emitCityChanged();
    },
    getCurrentCity: function () {
      return window.CityManager.getCity();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("CitySync: DOM загружен, обновляем отображение");
      cityManager.updateDisplay();
    });
  } else {
    setTimeout(() => {
      console.log("CitySync: Страница уже загружена, обновляем отображение");
      cityManager.updateDisplay();
    }, 100);
  }

  console.log(
    "✅ CityManager инициализирован. Текущий город:",
    cityManager.getCity().data?.name,
  );
})();
