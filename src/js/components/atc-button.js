import { addToCartSubmit } from "../core/helpers/addToCartSubmit";

class AtcButton extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector("form")
    this.init();
  }

  get cartNotification() {
    return this.getAttribute("data-cart-notification");
  }

  init() {
    this.addListeners()
  }

  addListeners() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      addToCartSubmit(event, this.cartNotification);
    })
  }
}

customElements.define("atc-button", AtcButton);
