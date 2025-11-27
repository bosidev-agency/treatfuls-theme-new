import { addToCartSubmit } from "../core/helpers/addToCartSubmit";

class ProductForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.submitForm = this.querySelector('form[action="/cart/add"]');
    this.submitForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addToCartSubmit(event);
    });
  }
}

customElements.define("product-form", ProductForm);
