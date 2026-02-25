class BundleBuilder extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.submitForm = this.querySelector("form[action='/cart/add']");
    this.summaryItems = this.querySelector(".bundle-builder__summary-items");
    this.addButtons = this.querySelectorAll(".cart-upsell__button");

    this.addButtons.forEach((button) => {
      button.addEventListener("click", this.handleAddButtonClick.bind(this));
    });

    this.submitForm.addEventListener(
      "submit",
      this.handleSubmitForm.bind(this),
    );
  }

  disconnectedCallback() {}

  handleAddButtonClick(event) {
    const productEl = event.currentTarget.closest(".bundle-builder__product");
    const template = productEl.querySelector("template");
    if (!template) return;
    const itemContent = template.content.cloneNode(true);
    const newItem = itemContent.querySelector(".bundle-builder__item");
    const variantId = newItem?.getAttribute("data-variant-id");

    const existingItem = variantId
      ? this.summaryItems.querySelector(
          `.bundle-builder__item[data-variant-id="${variantId}"]`,
        )
      : null;

    if (existingItem) {
      const quantityInput = existingItem.querySelector(
        'input[name="quantity"]',
      );
      if (quantityInput) {
        const current = parseInt(quantityInput.value, 10) || 1;
        const max = parseInt(quantityInput.getAttribute("max"), 10) || 99;
        quantityInput.value = Math.min(current + 1, max);
      }
    } else {
      this.summaryItems.appendChild(itemContent);
    }
  }

  handleSubmitForm(event) {
    event.preventDefault();
    const itemEls = this.summaryItems.querySelectorAll(".bundle-builder__item");
    const _bundleId = new Date().getTime();
    const _bundleSize = Array.from(itemEls).reduce(
      (acc, item) =>
        acc +
        (parseInt(item.querySelector('input[name*="quantity"]')?.value, 10) ||
          1),
      0,
    );
    const parentItem = this.submitForm.querySelector('input[name="id"]');
    const parentQuantity = this.submitForm.querySelector(
      'input[name="quantity"]',
    );
    let items = [];
    if (parentItem) {
      items.push({
        id: parentItem.value,
        quantity: parentQuantity.value,
        properties: {
          _isBundleParent: true,
          _bundleId: _bundleId,
        },
      });
    }
    items = items
      .concat(
        Array.from(itemEls).map((el) => {
          const idInput = el.querySelector('input[name*="id"]');
          const quantityInput = el.querySelector('input[name*="quantity"]');

          return {
            id: idInput ? idInput.value : null,
            quantity: quantityInput
              ? parseInt(quantityInput.value, 10) || 1
              : 1,
            parent_id: parentItem ? parentItem.value : null,
            properties: {
              _bundleName: "test",
              _bundleId: _bundleId,
              _bundleSize: _bundleSize,
            },
          };
        }),
      )
      .filter((item) => item.id);

    const formData = {
      items: items,
      sections: "main-cart-mini,cart-count",
    };

    fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        document.dispatchEvent(
          new CustomEvent("cart:change", {
            detail: data,
            bubbles: true,
          }),
        );
      })
      .catch((error) => console.error("Error adding item to cart:", error));
  }
}

customElements.define("bundle-builder", BundleBuilder);

class QuantitySelector extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.quantityInput = this.querySelector('input[name="quantity"]');
    this.incrementButton = this.querySelector('[data-quantity="increment"]');
    this.decrementButton = this.querySelector('[data-quantity="decrement"]');

    this.incrementButton.addEventListener(
      "click",
      this.handleIncrementButtonClick.bind(this),
    );
    this.decrementButton.addEventListener(
      "click",
      this.handleDecrementButtonClick.bind(this),
    );
  }

  disconnectedCallback() {}

  handleIncrementButtonClick(event) {
    const quantity = parseInt(this.quantityInput.value, 10) || 1;
    const min = parseInt(this.quantityInput.getAttribute("min"), 10) || 1;
    this.quantityInput.value = Math.max(quantity + 1, min);
  }

  handleDecrementButtonClick(event) {
    const quantity = parseInt(this.quantityInput.value, 10) || 1;
    const min = parseInt(this.quantityInput.getAttribute("min"), 10) || 1;
    this.quantityInput.value = Math.max(quantity - 1, min);
  }
}

customElements.define("quantity-selector", QuantitySelector);
