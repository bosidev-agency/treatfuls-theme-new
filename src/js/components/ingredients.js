class IngredientsContainer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.incrementButton = this.querySelector('[data-quantity="increment"]');
    this.decrementButton = this.querySelector('[data-quantity="decrement"]');
    this.quantityInput = this.querySelector('[name="quantity"]');
    this.ingredientValues = this.querySelectorAll('[data-ingredient-value]')

    this.incrementButton.addEventListener("click", () => {
      this.changeQuantity(parseInt(this.quantityInput.value) + 1);
    });

    this.decrementButton.addEventListener("click", () => {
      this.changeQuantity(parseInt(this.quantityInput.value) - 1);
    });
  }

  disconnectedCallback() {}

  changeQuantity(newQuantity) {
    if (newQuantity < 1 || newQuantity > 50) {
      return;
    }

    this.quantityInput.value = newQuantity;

    if (parseInt(this.quantityInput.value) > 49) {
      this.incrementButton.disabled;
    } else if (parseInt(this.quantityInput.value) < 2) {
      this.decrementButton.disabled;
    } else {
      this.incrementButton.disabled = false;
      this.decrementButton.disabled = false;
    }

    this.ingredientValues.forEach((value) => {
      value.textContent = parseInt(value.dataset.ingredientValue) * newQuantity
    })
  }
}

customElements.define("ingredients-container", IngredientsContainer);
