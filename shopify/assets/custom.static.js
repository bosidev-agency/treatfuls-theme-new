var moneyFormat = "€{{amount}}"; // eslint-disable-line camelcase

function formatMoney(cents, format) {
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || moneyFormat;

  function formatWithDelimiters(number, precision, thousands, decimal) {
    thousands = thousands || ".";
    decimal = decimal || ",";

    if (isNaN(number) || number === null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split(".");
    var dollarsAmount = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      "$1" + thousands,
    );
    var centsAmount = parts[1] ? decimal + parts[1] : "";

    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
    case "amount_no_decimals_with_space_separator":
      value = formatWithDelimiters(cents, 0, " ");
      break;
    case "amount_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 2, "'");
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

class BundleBuilder extends HTMLElement {
  constructor() {
    super();
  }

  get bundleName() {
    return this.dataset.bundleName;
  }

  connectedCallback() {
    this.submitForm = this.querySelector("form[action='/cart/add']");
    this.submitButton = this.querySelector("button[type='submit']");
    this.summaryItems = this.querySelector(".bundle-builder__summary-items");
    this.addButtons = this.querySelectorAll(".bundle-builder__product");
    this.productPools = Array.from(
      this.querySelectorAll(".bundle-builder__product-pool"),
    );
    this.sizeSelectors = this.querySelectorAll("input[name='box-size']");
    this.alertModal = this.querySelector("#Alert");
    this.emptyCartButton = this.alertModal.querySelector(
      "[data-action='empty-cart']",
    );
    this.currentSize = this.querySelector(
      "input[name='box-size']:checked",
    ).value;
    this.itemBar = this.querySelector(".shipping-bar");
    this.itemBarProgress = this.querySelector(".shipping-bar__progress");
    this.itemBarCount = this.querySelector(".shipping-bar__text-amount");
    this.itemBarTextRemaining = this.querySelector(
      ".shipping-bar__text--remaining",
    );
    this.itemBarTextAchieved = this.querySelector(
      ".shipping-bar__text--achieved",
    );
    this.combinedQuantity = 0;
    this.lastSelectedSize = null;
    this.filters = Array.from(
      this.querySelectorAll("input[name='bundle-filter']"),
    );
    this.summaryPrice = this.querySelector(".bundle-builder__price");

    this.addButtons.forEach((button) => {
      button.addEventListener("click", this.handleAddButtonClick.bind(this));
    });

    this.submitForm.addEventListener(
      "submit",
      this.handleSubmitForm.bind(this),
    );

    this.sizeSelectors.forEach((selector) => {
      selector.addEventListener(
        "change",
        this.handleSizeSelectorChange.bind(this),
      );
    });

    this.filters.forEach((filter) => {
      filter.addEventListener("change", this.handleFilterChange.bind(this));
    });

    this.emptyCartButton.addEventListener(
      "click",
      this.handleEmptyCartButtonClick.bind(this),
    );

    document.addEventListener(
      "quantity:changed",
      this.updateBundleBuilder.bind(this),
    );
  }

  disconnectedCallback() {}

  handleFilterChange(event) {
    const activeFilters = this.filters
      .filter((filter) => filter.checked)
      .map((filter) => filter.value);
    if (activeFilters.length > 0) {
      this.productPools.forEach((item) => {
        const itemFilter = item.dataset.filter;
        if (activeFilters.includes(itemFilter)) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    } else {
      this.productPools.forEach((item) => {
        item.classList.remove("hidden");
      });
    }
  }

  handleAddButtonClick(event) {
    const productEl = event.currentTarget;
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

    this.updateBundleBuilder();
  }

  updateBundleBuilder(event) {
    this.combinedQuantity = Array.from(
      this.summaryItems.querySelectorAll(".bundle-builder__item"),
    ).reduce(
      (acc, item) =>
        acc +
          parseInt(item.querySelector('input[name*="quantity"]')?.value, 10) ||
        1,
      0,
    );
    const incrementButtons = this.querySelectorAll(
      ".quantity-element__button[data-quantity='increment']",
    );
    this.itemBar.dataset.current = this.combinedQuantity;
    this.itemBar.style.setProperty(
      "--progress",
      this.combinedQuantity / this.itemBar.dataset.threshold,
    );
    this.itemBarCount.textContent =
      this.itemBar.dataset.threshold - this.combinedQuantity;
    const totalPrice = Array.from(
      this.summaryItems.querySelectorAll(".bundle-builder__item"),
    ).reduce((acc, item) => {
      const price = parseInt(item.getAttribute("data-price"), 10) || 0;
      const quantity =
        parseInt(item.querySelector('input[name*="quantity"]')?.value, 10) || 1;
      return acc + price * quantity;
    }, 0);
    this.summaryPrice.innerHTML = formatMoney(totalPrice);
    if (this.combinedQuantity >= this.itemBar.dataset.threshold) {
      this.submitButton.disabled = false;
      this.submitButton.textContent = "In den Warenkorb";

      this.itemBarProgress.classList.add("shipping-bar__progress--achieved");
      this.itemBarProgress.classList.remove(
        "shipping-bar__progress--remaining",
      );
      this.itemBarTextRemaining.classList.add("hidden");
      this.itemBarTextAchieved.classList.remove("hidden");
      this.addButtons.forEach((button) => {
        button.classList.add("disabled");
      });
      incrementButtons.forEach((button) => {
        button.disabled = true;
      });
    } else {
      this.submitButton.disabled = true;
      this.submitButton.textContent = "Wähle Produkte";
      this.itemBarProgress.classList.add("shipping-bar__progress--remaining");
      this.itemBarProgress.classList.remove("shipping-bar__progress--achieved");
      this.itemBarTextRemaining.classList.remove("hidden");
      this.itemBarTextAchieved.classList.add("hidden");
      this.addButtons.forEach((button) => {
        button.classList.remove("disabled");
      });
      incrementButtons.forEach((button) => {
        button.disabled = false;
      });
    }
    if (event?.detail?.remove) {
      console.log(event.detail.element);
      const itemEl = event.detail.element.closest(".bundle-builder__item");
      itemEl.remove();
      this.updateBundleBuilder();
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
          _bundleName: this.bundleName,
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
              _bundleName: this.bundleName,
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

  handleSizeSelectorChange(event) {
    const size = parseInt(event.currentTarget.value, 10);
    this.lastSelectedSize = size;
    if (this.lastSelectedSize < this.itemBar.dataset.threshold) {
      if (this.combinedQuantity > 0) {
        this.alertModal.togglePopover();
      } else {
        this.itemBar.dataset.threshold = size;
        this.updateBundleBuilder();
      }
    } else {
      this.itemBar.dataset.threshold = this.lastSelectedSize;
      this.updateBundleBuilder();
    }
  }

  handleEmptyCartButtonClick(event) {
    this.summaryItems.innerHTML = "";
    this.itemBar.dataset.threshold = this.lastSelectedSize;
    this.updateBundleBuilder();
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
    document.dispatchEvent(
      new CustomEvent("quantity:changed", {
        detail: {
          element: event.currentTarget.closest("quantity-selector"),
          quantity: this.quantityInput.value,
          action: "increment",
        },
        bubbles: true,
      }),
    );
  }

  handleDecrementButtonClick(event) {
    const quantity = parseInt(this.quantityInput.value, 10) || 1;
    const min = parseInt(this.quantityInput.getAttribute("min"), 10) || 1;

    this.quantityInput.value = Math.max(quantity - 1, min);
    document.dispatchEvent(
      new CustomEvent("quantity:changed", {
        detail: {
          element: event.currentTarget.closest("quantity-selector"),
          quantity: this.quantityInput.value,
          action: "decrement",
          remove: quantity - 1 === 0,
        },
        bubbles: true,
      }),
    );
  }
}

customElements.define("quantity-selector", QuantitySelector);
