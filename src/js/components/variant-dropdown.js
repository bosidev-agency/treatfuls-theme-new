class VariantDropdown extends HTMLElement {
  constructor() {
    super();
  }

  get sectionId() {
    return this.getAttribute('data-section-id');
  }

  connectedCallback() {
    this.selectElement = this.querySelector('select[name="id"]');
    this.selectElement.addEventListener('change', this.handleChange.bind(this));
  }

  handleChange() {
    console.log('handleChange', this.selectElement.value);
    const url = `${window.location.pathname}?variant=${this.selectElement.value}&section_id=${this.sectionId}`;

    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data;

        document.querySelector("[data-product-price]").innerHTML =
          tempDiv.querySelector("[data-product-price]").innerHTML;

        const newUrl = new URL(url, window.location.origin);
        newUrl.searchParams.delete("section_id");
        window.history.pushState({}, "", newUrl.toString());
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error fetching variant:", error);
        }
      });
  }
}

customElements.define('variant-dropdown', VariantDropdown);