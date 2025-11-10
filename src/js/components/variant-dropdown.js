class VariantDropdown extends HTMLElement {
  constructor() {
    super();
  }

  get sectionId() {
    return this.getAttribute("data-section-id");
  }

  get productHandle() {
    return this.getAttribute("data-product-handle");
  }

  connectedCallback() {
    this.selectElement = this.querySelector('select[name="id"]');
    this.selectElement.addEventListener("change", this.handleChange.bind(this));
  }

  handleChange() {
    const url = `${window.Shopify.routes.root}products/${this.productHandle}?variant=${this.selectElement.value}&section_id=${this.sectionId}`;

    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data;

        this.closest('form[action="/cart/add"]').querySelector(
          "[data-price-wrapper]"
        ).innerHTML = tempDiv.querySelector(
          "[data-price-wrapper]"
        ).innerHTML;

        if (this.getAttribute("data-update-url") !== null) {
          const newUrl = new URL(url, window.location.origin);
          newUrl.searchParams.delete("section_id");
          window.history.pushState({}, "", newUrl.toString());
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error fetching variant:", error);
        }
      });
  }
}

customElements.define("variant-dropdown", VariantDropdown);
