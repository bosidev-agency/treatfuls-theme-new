class MiniCart extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.cartCountContainer = document.querySelector(".js-header-cat-items");
    this.container = document.querySelector(".minicart__container");
    this.overlay = document.querySelector(".minicart__overlay");
    this.openTrigger = document.querySelector("[data-open-minicart]");
    this.closeButton = this.querySelector(".minicart__close");
    this.continueShoppingButton = this.querySelector(".cart-order__link");

    this.closeCart = this.closeCart.bind(this);
    this.openCart = this.openCart.bind(this);
    this.updateMiniCartSection = this.updateMiniCartSection.bind(this);

    this.openTrigger.addEventListener("click", this.openCart);
    this.closeButton.addEventListener("click", this.closeCart);
    this.overlay.addEventListener("click", this.closeCart);
    document.addEventListener("cart:rerender", this.updateMiniCartSection);
  }

  // Lifecycle callback when the element is removed from the document
  disconnectedCallback() {
    this.openTrigger.removeEventListener("click", this.openCart);
    this.closeButton.removeEventListener("click", this.closeCart);
    this.overlay.removeEventListener("click", this.closeCart);
    document.removeEventListener("cart:rerender", this.updateMiniCartSection);
  }

  updateMiniCartSection(event) {
    const tempDiv = document.createElement("div");
    const tempCarCount = document.createElement("div");

    tempDiv.innerHTML = event.detail.sections["main-cart-mini"];
    tempCarCount.innerHTML = event.detail.sections["cart-count"];

    this.container.innerHTML = tempDiv.querySelector(
      ".minicart__container"
    ).innerHTML;
    this.cartCountContainer.innerHTML =
      tempCarCount.querySelector(".basket__count").innerHTML;

    if (!this.container.classList.contains("minicart__container--open")) {
      this.openCart();
    }
  }

  closeCart(e) {
    if (e) e.preventDefault();
    this.container.classList.remove("minicart__container--open");
    this.overlay.classList.remove("minicart__overlay--shown");
    document.documentElement.classList.remove("no-scroll");
  }

  openCart() {
    this.container.classList.add("minicart__container--open");
    this.overlay.classList.add("minicart__overlay--shown");
    document.documentElement.classList.add("no-scroll");
  }
}

customElements.define("mini-cart", MiniCart);
