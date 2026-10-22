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

  get parentVariantGid() {
    return this.dataset.parentId;
  }

  get parentProductVariantId() {
    return this.dataset.parentProductId;
  }

  boxDataProperty(itemSize) {
    const propertyPointer = (this.propertyPointer || "").trim();

    const boxData = {
      uniqueId: this.uniqueId,
      itemSize,
      parentId: this.parentVariantGid,
    };

    if (propertyPointer) {
      boxData.boxDiscount = propertyPointer;
    }

    return JSON.stringify(boxData);
  }

  boxLineProperties(itemSize) {
    return {
      _boxData: this.boxDataProperty(itemSize),
      _setId: this.uniqueId,
      _groupQuantity: String(itemSize),
    };
  }

  sumItemQuantities() {
    return Array.from(
      this.summaryItems.querySelectorAll(".bundle-builder__item"),
    ).reduce((acc, item) => {
      const quantity = parseInt(
        item.querySelector('input[name*="quantity"]')?.value,
        10,
      );
      return acc + (Number.isNaN(quantity) ? 0 : quantity);
    }, 0);
  }

  applyActiveTier(quantity) {
    let active = null;
    this.tiers.forEach((tier) => {
      if (quantity >= tier.quantity) active = tier;
    });
    this.percentageOff = active ? active.percentageOff : 0;
    this.propertyPointer = active ? active.propertyPointer : "";
  }

  segmentProgress(index, quantity) {
    const end = this.tiers[index].quantity;
    const start = index === 0 ? 0 : this.tiers[index - 1].quantity;
    if (quantity >= end) return 1;
    if (quantity <= start || end <= start) return 0;
    return (quantity - start) / (end - start);
  }

  renderMilestones() {
    if (!this.milestones) return;
    this.tiers.forEach((tier, index) => {
      tier.element.classList.toggle(
        "is-reached",
        this.combinedQuantity >= tier.quantity,
      );
      if (!tier.segment) return;
      tier.segment.style.setProperty(
        "--segment-progress",
        String(this.segmentProgress(index, this.combinedQuantity)),
      );
    });
  }

  clearVariant(variantId) {
    const productCard = this.querySelector(
      `.bundle-builder__product[data-variant-id="${variantId}"]`,
    );
    if (productCard) {
      const productQtySelector = productCard.querySelector(
        ".bundle-builder__product-actions > quantity-selector",
      );
      if (productQtySelector) {
        productQtySelector.classList.add("hidden");
        const input = productQtySelector.querySelector('input[name="quantity"]');
        if (input) input.value = 1;
      }
      const addBtn = productCard.querySelector(".bundle-builder__add");
      if (addBtn) addBtn.classList.remove("hidden");
    }

    const summaryItem = this.summaryItems.querySelector(
      `.bundle-builder__item[data-variant-id="${variantId}"]`,
    );
    if (summaryItem) summaryItem.remove();
  }

  renderSummaryPrice() {
    const hasDiscount = this.percentageOff > 0;
    const displayPrice = hasDiscount
      ? Math.round((this.totalPrice * (100 - this.percentageOff)) / 100)
      : this.totalPrice;

    const compareMarkup =
      hasDiscount && this.totalPrice > 0
        ? `<s class="bundle-builder__price-compare">${formatMoney(this.totalPrice)}</s>`
        : "";
    const badgeMarkup = hasDiscount
      ? `<span class="bundle-builder__discount-badge">-${this.percentageOff}%</span>`
      : "";

    this.summaryPrice.classList.toggle(
      "bundle-builder__price--on-sale",
      hasDiscount && this.totalPrice > 0,
    );
    this.summaryPrice.innerHTML = `
      ${compareMarkup}
      <span class="bundle-builder__price-current">${formatMoney(displayPrice)}</span>
      ${badgeMarkup}
    `;
  }

  connectedCallback() {
    this.submitForm = this.querySelector("form[action='/cart/add']");
    this.submitButton = this.querySelector("button[type='submit']");
    this.summaryItems = this.querySelector(".bundle-builder__summary-items");
    this.addButtons = this.querySelectorAll(".bundle-builder__add");
    this.productPools = Array.from(
      this.querySelectorAll(".bundle-builder__product-pool"),
    );
    this.milestones = this.querySelector(".bundle-builder__milestones");
    this.milestoneItems = this.querySelector(".bundle-builder__milestones-items");
    this.tiers = Array.from(this.querySelectorAll(".bundle-builder__milestone"))
      .map((element) => ({
        element,
        segment: element.querySelector(".bundle-builder__milestone-segment"),
        quantity: parseInt(element.dataset.quantity, 10) || 0,
        percentageOff: parseInt(element.dataset.percentageOff, 10) || 0,
        propertyPointer: (element.dataset.propertyPointer || "").trim(),
      }))
      .sort((a, b) => a.quantity - b.quantity);
    if (this.milestoneItems) {
      this.tiers.forEach((tier) => this.milestoneItems.appendChild(tier.element));
    }
    this.minQuantity = this.tiers[0]?.quantity || 0;
    this.maxQuantity = this.tiers[this.tiers.length - 1]?.quantity || 0;
    this.percentageOff = 0;
    this.propertyPointer = "";
    this.combinedQuantity = 0;
    this.formData = null;
    this.uniqueId = null;
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

    this.poolFilters.forEach((filter) => {
      filter.addEventListener("change", this.handleFilterChange.bind(this));
    });
    this.metafieldFilters.forEach((filter) => {
      filter.addEventListener("change", this.handleFilterChange.bind(this));
    });

    document.addEventListener(
      "quantity:changed",
      this.updateBundleBuilder.bind(this),
    );

    this.updateBundleBuilder();
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

        if (this.goodieModal && this.goodieModal.matches(":popover-open")) {
          this.goodieModal.togglePopover();
        }

        this.summaryItems.innerHTML = "";
        this.querySelectorAll(".bundle-builder__product").forEach((product) => {
          const qs = product.querySelector(".bundle-builder__product-actions > quantity-selector");
          if (qs) {
            qs.classList.add("hidden");
            const input = qs.querySelector('input[name="quantity"]');
            if (input) input.value = 1;
          }
          const addBtn = product.querySelector(".bundle-builder__add");
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
    if (this.maxQuantity > 0 && this.combinedQuantity >= this.maxQuantity) return;

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
        ".bundle-builder__product-actions > quantity-selector",
      );
      if (productQtySelector) productQtySelector.classList.remove("hidden");
      const addBtn = productEl.querySelector(".bundle-builder__add");
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
        '.bundle-builder__product-actions > quantity-selector input[name="quantity"]',
      );
      if (input && input !== sourceElement) input.value = newValue;
    }
    if (summaryItem) {
      const input = summaryItem.querySelector('input[name="quantity"]');
      if (input && input !== sourceElement) input.value = newValue;
    }
  }

  updateBundleBuilder(event) {
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

    this.combinedQuantity = this.sumItemQuantities();

    if (
      this.maxQuantity > 0 &&
      this.combinedQuantity > this.maxQuantity &&
      event?.detail?.element
    ) {
      const changedInput = event.detail.element.querySelector(
        'input[name*="quantity"]',
      );
      if (changedInput) {
        const overshoot = this.combinedQuantity - this.maxQuantity;
        const currentVal = parseInt(changedInput.value, 10) || 0;
        const nextVal = Math.max(currentVal - overshoot, 0);
        const qtySelector = event.detail.element;
        const productEl = qtySelector.closest(".bundle-builder__product");
        const itemEl = qtySelector.closest(".bundle-builder__item");
        const variantId =
          productEl?.dataset.variantId || itemEl?.dataset.variantId;

        if (nextVal === 0 && variantId) {
          this.clearVariant(variantId);
        } else {
          changedInput.value = String(nextVal);
          if (variantId) {
            this.syncQuantitySelectors(
              variantId,
              changedInput.value,
              changedInput,
            );
          }
        }

        this.combinedQuantity = this.sumItemQuantities();
      }
    }

    const incrementButtons = this.querySelectorAll(
      ".quantity-element__button[data-quantity='increment']",
    );
    this.totalPrice = Array.from(
      this.summaryItems.querySelectorAll(".bundle-builder__item"),
    ).reduce((acc, item) => {
      const price = parseInt(item.getAttribute("data-price"), 10) || 0;
      const quantity = parseInt(
        item.querySelector('input[name*="quantity"]')?.value,
        10,
      );
      return acc + price * (Number.isNaN(quantity) ? 0 : quantity);
    }, 0);
    this.applyActiveTier(this.combinedQuantity);
    this.renderMilestones();
    this.renderSummaryPrice();

    const canSubmit =
      this.combinedQuantity >= this.minQuantity && this.combinedQuantity > 0;
    const atMax =
      this.maxQuantity > 0 && this.combinedQuantity >= this.maxQuantity;

    this.submitButton.disabled = !canSubmit;
    this.submitButton.textContent = canSubmit
      ? "In den Warenkorb"
      : "Wähle Produkte";
    this.addButtons.forEach((button) => {
      button.disabled = atMax;
    });
    incrementButtons.forEach((button) => {
      button.disabled = atMax;
    });

    if (event?.detail?.remove) {
      const itemEl = event.detail.element.closest(".bundle-builder__item");
      const productEl = event.detail.element.closest(
        ".bundle-builder__product",
      );
      const variantId =
        itemEl?.dataset.variantId || productEl?.dataset.variantId;

      if (variantId) this.clearVariant(variantId);

      this.updateBundleBuilder();
    }
  }

  handleSubmitForm(event) {
    event.preventDefault();
    if (
      this.combinedQuantity < this.minQuantity ||
      (this.maxQuantity > 0 && this.combinedQuantity > this.maxQuantity)
    ) {
      return;
    }
    const itemEls = this.summaryItems.querySelectorAll(".bundle-builder__item");
    this.uniqueId = String(Date.now());

    const items = [];

    if (this.parentProductVariantId) {
      items.push({
        id: this.parentProductVariantId,
        quantity: 1,
        properties: this.boxLineProperties(1),
      });
    }

    Array.from(itemEls).forEach((el) => {
      const idInput = el.querySelector('input[name*="id"]');
      const quantityInput = el.querySelector('input[name*="quantity"]');
      const quantity = quantityInput
        ? parseInt(quantityInput.value, 10) || 1
        : 1;

      if (!idInput?.value) return;

      items.push({
        id: idInput.value,
        quantity,
        properties: this.boxLineProperties(quantity),
      });
    });

    this.formData = {
      items,
      sections: "main-cart-mini,cart-count",
    };

    if (this.goodieThreshold && this.goodieModal && this.totalPrice >= this.goodieThreshold) {
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
      properties: this.boxLineProperties(1),
    });

    this.handleAddToCart();
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
