// city-autocomplete.js - поиск по 1134 городам
class CityAutocomplete {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      onSelect: options.onSelect || (() => {}),
      placeholder: options.placeholder || "Начните вводить название города...",
      maxResults: options.maxResults || 15,
    };
    this.init();
  }

  init() {
    this.resultsContainer = document.createElement("div");
    this.resultsContainer.className = "city-autocomplete-results";
    this.resultsContainer.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      width: ${this.input.offsetWidth}px;
      display: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    `;

    this.input.parentNode.insertBefore(this.resultsContainer, this.input.nextSibling);
    this.input.setAttribute("autocomplete", "off");
    this.input.setAttribute("placeholder", this.options.placeholder);
    this.bindEvents();
  }

  bindEvents() {
    this.input.addEventListener("input", (e) => this.handleInput(e));
    document.addEventListener("click", (e) => {
      if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
        this.hideResults();
      }
    });
    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));
  }

  handleInput(e) {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      this.hideResults();
      return;
    }
    
    const cities = window.STANDARD_CITIES || [];
    const results = cities
      .filter(city => city.toLowerCase().includes(query))
      .slice(0, this.options.maxResults);
    
    this.showResults(results);
  }

  handleKeydown(e) {
    const items = this.resultsContainer.querySelectorAll(".city-item");
    let currentIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains("active")) currentIndex = index;
    });

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (items.length > 0) this.setActiveItem((currentIndex + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (items.length > 0) this.setActiveItem((currentIndex - 1 + items.length) % items.length);
        break;
      case "Enter":
        e.preventDefault();
        if (currentIndex >= 0 && items[currentIndex]) items[currentIndex].click();
        break;
      case "Escape":
        this.hideResults();
        break;
    }
  }

  showResults(cities) {
    this.resultsContainer.innerHTML = "";
    if (cities.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "city-no-results";
      noResults.textContent = "Город не найден";
      noResults.style.cssText = "padding: 15px; color: #666; text-align: center;";
      this.resultsContainer.appendChild(noResults);
    } else {
      cities.forEach((city, index) => {
        const item = document.createElement("div");
        item.className = "city-item";
        item.dataset.city = city;
        item.style.cssText = `
          padding: 12px 15px;
          cursor: pointer;
          border-bottom: 1px solid #f5f5f5;
          transition: background-color 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        
        const parts = city.split(',');
        const cityName = parts[0];
        const region = parts.slice(1).join(',').trim();
        
        const nameSpan = document.createElement("span");
        nameSpan.textContent = cityName;
        nameSpan.style.fontWeight = "bold";
        
        const regionSpan = document.createElement("span");
        regionSpan.textContent = region;
        regionSpan.style.cssText = "font-size: 11px; color: #999;";
        
        item.appendChild(nameSpan);
        item.appendChild(regionSpan);
        
        item.addEventListener("mouseenter", () => this.setActiveItem(index));
        item.addEventListener("click", () => this.selectCity(city));
        this.resultsContainer.appendChild(item);
      });
      this.setActiveItem(0);
    }
    this.resultsContainer.style.display = "block";
    this.updatePosition();
  }

  hideResults() { this.resultsContainer.style.display = "none"; }
  
  updatePosition() {
    const rect = this.input.getBoundingClientRect();
    this.resultsContainer.style.top = rect.bottom + window.scrollY + "px";
    this.resultsContainer.style.left = rect.left + window.scrollX + "px";
    this.resultsContainer.style.width = rect.width + "px";
  }

  setActiveItem(index) {
    const items = this.resultsContainer.querySelectorAll(".city-item");
    items.forEach(item => item.classList.remove("active"));
    if (items[index]) {
      items[index].classList.add("active");
      items[index].style.backgroundColor = "#f0f7ff";
      items[index].scrollIntoView({ block: "nearest" });
    }
  }

  selectCity(city) {
    this.input.value = city;
    if (this.options.onSelect) {
      this.options.onSelect({ name: city.split(',')[0].trim(), fullName: city });
    }
    this.hideResults();
  }

  getSelectedCity() { return this.selectedCity; }
  setCity(city) { if (city) this.input.value = city.fullName || city; }
  destroy() { if (this.resultsContainer?.parentNode) this.resultsContainer.parentNode.removeChild(this.resultsContainer); }
}

window.CityAutocomplete = CityAutocomplete;

// Автоматическая инициализация
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-city-autocomplete]").forEach((element) => {
    new CityAutocomplete(element, {
      onSelect: (city) => { 
        element.dataset.cityData = JSON.stringify(city);
        if (window.CityManager) {
          window.CityManager.setCity(city.fullName);
        }
      }
    });
  });
});
