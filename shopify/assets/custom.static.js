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

  get goodieThreshold() {
    return this.dataset.goodieThreshold;
  }

  connectedCallback() {
    this.submitForm = this.querySelector("form[action='/cart/add']");
    this.submitButton = this.querySelector("button[type='submit']");
    this.summaryItems = this.querySelector(".bundle-builder__summary-items");
    this.addButtons = this.querySelectorAll(".bundle-builder__product-header");
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
    this.formData = null;
    this.bundleId = null;
    this.parentItem = null;
    this.poolFilters = Array.from(
      this.querySelectorAll("input[name='pool-filter']"),
    );
    this.metafieldFilters = Array.from(
      this.querySelectorAll("input[name^='filter-']"),
    );
    this.summaryPrice = this.querySelector(".bundle-builder__price");
    this.goodieModal = this.querySelector("#Goodies");
    if (this.goodieModal) {
      this.goodieButtons = this.goodieModal.querySelectorAll("[data-add-goodie]");
      this.continueButton = this.goodieModal.querySelector("[data-continue]");
    }

    this.addButtons.forEach((button) => {
      button.addEventListener("click", this.handleAddButtonClick.bind(this));
    });

    if (this.goodieButtons) {
      this.goodieButtons.forEach((button) => {
        button.addEventListener(
          "click",
          this.handleAddGoodieButtonClick.bind(this),
        );
      });
    }

    if (this.continueButton) {
      this.continueButton.addEventListener(
        "click",
        this.handleAddToCart.bind(this),
      );
    }

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

    this.poolFilters.forEach((filter) => {
      filter.addEventListener("change", this.handleFilterChange.bind(this));
    });
    this.metafieldFilters.forEach((filter) => {
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

  handleAddToCart() {
    fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(this.formData),
    })
      .then((response) => response.json())
      .then((data) => {
        document.dispatchEvent(
          new CustomEvent("cart:change", {
            detail: {
              data,
              cartNotification: false,
            },
            bubbles: true,
          }),
        );

        if (this.goodieModal.matches(":popover-open")) {
          this.goodieModal.togglePopover();
        }

        this.summaryItems.innerHTML = "";
        this.querySelectorAll(".bundle-builder__product").forEach((product) => {
          const qs = product.querySelector(":scope > quantity-selector");
          if (qs) {
            qs.classList.add("hidden");
            const input = qs.querySelector('input[name="quantity"]');
            if (input) input.value = 1;
          }
          const addBtn = product.querySelector(".cart-upsell__button");
          if (addBtn) addBtn.classList.remove("hidden");
        });
        this.formData = null;
        this.updateBundleBuilder();
      })
      .catch((error) => console.error("Error adding item to cart:", error));
  }

  handleFilterChange() {
    const activePoolFilters = this.poolFilters
      .filter((f) => f.checked)
      .map((f) => f.value);

    this.productPools.forEach((pool) => {
      if (
        activePoolFilters.length === 0 ||
        activePoolFilters.includes(pool.dataset.poolFilter)
      ) {
        pool.classList.remove("hidden");
      } else {
        pool.classList.add("hidden");
      }
    });

    const activeMetafilters = {};
    this.metafieldFilters.forEach((f) => {
      if (!f.checked) return;
      if (!activeMetafilters[f.name]) activeMetafilters[f.name] = [];
      activeMetafilters[f.name].push(f.value);
    });

    const filterGroups = Object.values(activeMetafilters);
    const products = this.querySelectorAll(".bundle-builder__product");

    products.forEach((product) => {
      if (filterGroups.length === 0) {
        product.classList.remove("hidden");
        return;
      }

      const productValues = (product.dataset.filters || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const matches = filterGroups.every((group) =>
        group.some((value) => productValues.includes(value)),
      );

      product.classList.toggle("hidden", !matches);
    });
  }

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
        this.syncQuantitySelectors(
          variantId,
          quantityInput.value,
          quantityInput,
        );
      }
    } else {
      this.summaryItems.appendChild(itemContent);
      const productQtySelector = productEl.querySelector(
        ":scope > quantity-selector",
      );
      if (productQtySelector) productQtySelector.classList.remove("hidden");
      const addBtn = productEl.querySelector(".cart-upsell__button");
      if (addBtn) addBtn.classList.add("hidden");
    }

    this.updateBundleBuilder();
  }

  syncQuantitySelectors(variantId, newValue, sourceElement) {
    const productCard = this.querySelector(
      `.bundle-builder__product[data-variant-id="${variantId}"]`,
    );
    const summaryItem = this.summaryItems.querySelector(
      `.bundle-builder__item[data-variant-id="${variantId}"]`,
    );

    if (productCard) {
      const input = productCard.querySelector(
        ':scope > quantity-selector input[name="quantity"]',
      );
      if (input && input !== sourceElement) input.value = newValue;
    }
    if (summaryItem) {
      const input = summaryItem.querySelector('input[name="quantity"]');
      if (input && input !== sourceElement) input.value = newValue;
    }
  }

  updateBundleBuilder(event) {
    const threshold = parseInt(this.itemBar.dataset.threshold, 10) || 0;

    if (event?.detail?.element) {
      const qtySelector = event.detail.element;
      const sourceInput = qtySelector.querySelector('input[name="quantity"]');
      const productEl = qtySelector.closest(".bundle-builder__product");
      const itemEl = qtySelector.closest(".bundle-builder__item");
      const variantId =
        productEl?.dataset.variantId || itemEl?.dataset.variantId;
      if (variantId && sourceInput) {
        this.syncQuantitySelectors(variantId, sourceInput.value, sourceInput);
      }
    }

    this.combinedQuantity = Array.from(
      this.summaryItems.querySelectorAll(".bundle-builder__item"),
    ).reduce(
      (acc, item) =>
        acc +
          parseInt(item.querySelector('input[name*="quantity"]')?.value, 10) ||
        1,
      0,
    );

    if (this.combinedQuantity > threshold && event?.detail?.element) {
      const changedInput = event.detail.element.querySelector(
        'input[name*="quantity"]',
      );
      if (changedInput) {
        const overshoot = this.combinedQuantity - threshold;
        const currentVal = parseInt(changedInput.value, 10) || 1;
        const min = parseInt(changedInput.getAttribute("min"), 10) || 1;
        changedInput.value = Math.max(currentVal - overshoot, min);

        const qtySelector = event.detail.element;
        const productEl = qtySelector.closest(".bundle-builder__product");
        const itemEl = qtySelector.closest(".bundle-builder__item");
        const variantId =
          productEl?.dataset.variantId || itemEl?.dataset.variantId;
        if (variantId) {
          this.syncQuantitySelectors(
            variantId,
            changedInput.value,
            changedInput,
          );
        }

        this.combinedQuantity = Array.from(
          this.summaryItems.querySelectorAll(".bundle-builder__item"),
        ).reduce(
          (acc, item) =>
            acc +
              parseInt(
                item.querySelector('input[name*="quantity"]')?.value,
                10,
              ) || 1,
          0,
        );
      }
    }

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
    this.totalPrice = Array.from(
      this.summaryItems.querySelectorAll(".bundle-builder__item"),
    ).reduce((acc, item) => {
      const price = parseInt(item.getAttribute("data-price"), 10) || 0;
      const quantity =
        parseInt(item.querySelector('input[name*="quantity"]')?.value, 10) || 1;
      return acc + price * quantity;
    }, 0);
    this.summaryPrice.innerHTML = formatMoney(this.totalPrice);
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
      const itemEl = event.detail.element.closest(".bundle-builder__item");
      const productEl = event.detail.element.closest(
        ".bundle-builder__product",
      );
      const variantId =
        itemEl?.dataset.variantId || productEl?.dataset.variantId;

      if (variantId) {
        const productCard = this.querySelector(
          `.bundle-builder__product[data-variant-id="${variantId}"]`,
        );
        if (productCard) {
          const productQtySelector = productCard.querySelector(
            ":scope > quantity-selector",
          );
          if (productQtySelector) {
            productQtySelector.classList.add("hidden");
            const input = productQtySelector.querySelector(
              'input[name="quantity"]',
            );
            if (input) input.value = 1;
          }
          const addBtn = productCard.querySelector(".cart-upsell__button");
          if (addBtn) addBtn.classList.remove("hidden");
        }

        const summaryItem = this.summaryItems.querySelector(
          `.bundle-builder__item[data-variant-id="${variantId}"]`,
        );
        if (summaryItem) summaryItem.remove();
      }

      this.updateBundleBuilder();
    }
  }

  handleSubmitForm(event) {
    event.preventDefault();
    const itemEls = this.summaryItems.querySelectorAll(".bundle-builder__item");
    this.bundleId = new Date().getTime();
    const _bundleSize = Array.from(itemEls).reduce(
      (acc, item) =>
        acc +
        (parseInt(item.querySelector('input[name*="quantity"]')?.value, 10) ||
          1),
      0,
    );
    this.parentItem = this.submitForm.querySelector('input[name="id"]');
    const parentQuantity = this.submitForm.querySelector(
      'input[name="quantity"]',
    );
    let items = [];
    if (this.parentItem) {
      items.push({
        id: this.parentItem.value,
        quantity: parentQuantity.value,
        properties: {
          _isBundleParent: true,
          _bundleName: this.bundleName,
          _bundleId: this.bundleId,
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
            parent_id: this.parentItem ? this.parentItem.value : null,
            properties: {
              _bundleName: this.bundleName,
              _bundleId: this.bundleId,
              _bundleSize: _bundleSize,
            },
          };
        }),
      )
      .filter((item) => item.id);

    this.formData = {
      items: items,
      sections: "main-cart-mini,cart-count",
    };

    if (this.goodieThreshold && this.totalPrice >= this.goodieThreshold) {
      this.goodieModal.togglePopover();
    } else {
      this.handleAddToCart();
    }
  }

  handleAddGoodieButtonClick(event) {
    const goodieId = event.currentTarget.dataset.addGoodie;

    this.formData.items.push({
      id: goodieId,
      quantity: 1,
      parent_id: this.parentItem ? this.parentItem.value : null,
      properties: {
        _bundleName: this.bundleName,
        _bundleId: this.bundleId,
      },
    });

    this.handleAddToCart();
  }

  handleSizeSelectorChange(event) {
    const size = parseInt(event.currentTarget.value, 10);
    this.lastSelectedSize = size;
    if (this.lastSelectedSize < this.itemBar.dataset.threshold) {
      if (this.combinedQuantity > 0) {
        const oldRadio = this.querySelector(
          `input[name='box-size'][value='${this.itemBar.dataset.threshold}']`,
        );
        if (oldRadio) oldRadio.checked = true;
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
    const newRadio = this.querySelector(
      `input[name='box-size'][value='${this.lastSelectedSize}']`,
    );
    if (newRadio) newRadio.checked = true;
    this.summaryItems.innerHTML = "";
    this.querySelectorAll(".bundle-builder__product").forEach((product) => {
      const qs = product.querySelector(":scope > quantity-selector");
      if (qs) {
        qs.classList.add("hidden");
        const input = qs.querySelector('input[name="quantity"]');
        if (input) input.value = 1;
      }
      const addBtn = product.querySelector(".cart-upsell__button");
      if (addBtn) addBtn.classList.remove("hidden");
    });
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

    this.quantityInput.addEventListener(
      "input",
      this.handleQuantityInputChange.bind(this),
    );
    this.quantityInput.addEventListener(
      "change",
      this.handleQuantityInputChange.bind(this),
    );

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

  handleQuantityInputChange(event) {
    const raw = parseInt(this.quantityInput.value, 10);
    if (isNaN(raw)) return;

    const max = parseInt(this.quantityInput.getAttribute("max"), 10) || 99;

    if (raw <= 0) {
      this.quantityInput.value = 0;
      document.dispatchEvent(
        new CustomEvent("quantity:changed", {
          detail: {
            element: this,
            quantity: 0,
            action: "change",
            remove: true,
          },
          bubbles: true,
        }),
      );
      return;
    }

    this.quantityInput.value = Math.min(raw, max);

    document.dispatchEvent(
      new CustomEvent("quantity:changed", {
        detail: {
          element: this,
          quantity: this.quantityInput.value,
          action: "change",
        },
        bubbles: true,
      }),
    );
  }

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

class CartNotification extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.closeButton = this.querySelector(".cart-notification__close");
    if (this.closeButton) {
      this.closeButton.addEventListener(
        "click",
        this.closeNotification.bind(this),
      );
    }
    document.addEventListener(
      "show:notification",
      this.showNotification.bind(this),
    );
  }

  showNotification() {
    this.classList.add("cart-notification--shown");
    setTimeout(() => {
      this.closeNotification();
    }, 3000);
  }

  closeNotification() {
    this.classList.remove("cart-notification--shown");
  }
}

customElements.define("cart-notification", CartNotification);
