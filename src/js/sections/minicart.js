class MiniCart extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.cartCountContainer = document.querySelector(".js-header-cat-items");
    this.container = document.querySelector(".minicart__container");
    this.overlay = document.querySelector(".minicart__overlay");
    this.openTrigger = document.querySelector("[data-open-minicart]");
    this.continueShoppingButton = this.querySelector(".cart-order__link");
    this.closeButton = this.querySelector(".minicart__close");
    this.goodies = this.querySelector("cart-goodies");

    this.closeCart = this.closeCart.bind(this);
    this.openCart = this.openCart.bind(this);
    this.updateMiniCartSection = this.updateMiniCartSection.bind(this);

    this.openTrigger.addEventListener("click", this.openCart);
    this.attachCloseButtonListener();
    this.overlay.addEventListener("click", this.closeCart);
    document.addEventListener("cart:change", this.handleCartChange.bind(this));

    // Add event delegation as backup for close button
    this.addEventListener("click", this.handleClick.bind(this));
  }

  // Lifecycle callback when the element is removed from the document
  disconnectedCallback() {
    this.openTrigger.removeEventListener("click", this.openCart);
    this.removeCloseButtonListener();
    this.overlay.removeEventListener("click", this.closeCart);
    document.removeEventListener(
      "cart:change",
      this.handleCartChange.bind(this)
    );
    this.removeEventListener("click", this.handleClick.bind(this));
  }

  // Event delegation handler for close button
  handleClick(e) {
    if (e.target.closest(".minicart__close")) {
      this.closeCart(e);
    }
  }

  // Helper method to attach close button listener
  attachCloseButtonListener() {
    this.closeButton = this.querySelector(".minicart__close");
    if (this.closeButton) {
      this.closeButton.addEventListener("click", this.closeCart);
    }
  }

  // Helper method to remove close button listener
  removeCloseButtonListener() {
    if (this.closeButton) {
      this.closeButton.removeEventListener("click", this.closeCart);
    }
  }

  handleCartChange(event) {
    if (this.goodies) {
      fetch(`${window.Shopify.routes.root}cart.js`, { method: "GET" })
        .then((response) => response.json())
        .then((data) => {
          this.checkGoodies(data, event);
        });
    } else {
      this.updateMiniCartSection(event);
    }
  }

  checkGoodies(currentData, event) {
    const updates = {};
    const goodieData = JSON.parse(this.goodies.dataset.goodieData);

    goodieData.forEach((goodie) => {
      const cartHasGoodie = currentData.items.some((item) => {
        return item.id === goodie.id;
      });
      const thresholdReached = currentData.original_total_price >= goodie.threshold;
      const goodieLineItem = currentData.items.find((item) => {
        return item.id === goodie.it
      })
      const goodieCount = goodieLineItem ? goodieLineItem.quantity : 0;

      if (
        (cartHasGoodie && thresholdReached && goodieCount === 1) ||
        (!cartHasGoodie && !thresholdReached)
      ) {
        return;
      }

      if (cartHasGoodie && !thresholdReached) {
        updates[goodie.id] = 0;
        return;
      }

      if (!cartHasGoodie && thresholdReached) {
        updates[goodie.id] = 1;
        return;
      }

      if (cartHasGoodie && thresholdReached && goodieCount !== 1 ) {
        updates[goodie.id] = 1;
        return;
      }
    });

    if (Object.keys(updates).length === 0) {
      // Nothing to update, just refresh minicart section
      this.updateMiniCartSection(event);
      return;
    }

    fetch(`${window.Shopify.routes.root}cart/update.js`, {
      body: JSON.stringify({ updates, sections: "main-cart-mini,cart-count" }),
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // if (threshold reached and event.detail.items)
        this.updateMiniCartSection(data);
      })
      .catch((error) =>
        console.error("Error updating mini-cart section:", error)
      );
  }

  updateMiniCartSection(event) {
    const data = event.detail ? event.detail : event;
    const tempDiv = document.createElement("div");
    const tempCarCount = document.createElement("div");

    tempDiv.innerHTML = data.sections["main-cart-mini"];
    tempCarCount.innerHTML = data.sections["cart-count"];

    // Remove the old close button listener before updating content
    this.removeCloseButtonListener();

    this.container.innerHTML = tempDiv.querySelector(
      ".minicart__container"
    ).innerHTML;
    this.cartCountContainer.innerHTML =
      tempCarCount.querySelector(".basket__count").innerHTML;

    // Re-attach the close button listener after content update
    this.attachCloseButtonListener();

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
