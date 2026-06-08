import axios from "axios";
import qs from "qs";

const configHeader = {
  headers: {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
};

const URL = {
  objectJson: "/cart?view=object-json",
  add: "/cart/add.js",
  change: "/cart/change.js",
};

class CartItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.removeButton = this.querySelector(".cart-product__remove");
    this.addButton = this.querySelector(".cart-product__quantity-btn--plus");
    this.minusButton = this.querySelector(".cart-product__quantity-btn--minus");
    this.quantityChange = this.querySelector(".cart-product__quantity-input");
    this.itemKey = this.removeButton.dataset.itemKey;
    this.sectionId = this.closest("section").dataset.sectionId;
    this.cartCountContainer = document.querySelector(".js-header-cat-items");
    this.errorMessage = this.querySelector(".error-message");
    this.line = this.dataset.line;

    this.removeButton.addEventListener("click", () => {
      this.removeItem(this.itemKey);
    });

    this.addButton.addEventListener("click", () => {
      this.changeQuantity(this.itemKey, Number(this.quantityChange.value) + 1);
    });

    this.minusButton.addEventListener("click", () => {
      this.changeQuantity(this.itemKey, Number(this.quantityChange.value) - 1);
    });

    this.quantityChange.addEventListener("change", () => {
      this.changeQuantity(this.itemKey, Number(this.quantityChange.value));
    });
  }

  disconnectedCallback() {
    this.removeButton.removeEventListener("click", () => {
      this.removeItem(this.itemKey);
    });

    this.addButton.removeEventListener("click", () => {
      this.changeQuantity(this.itemKey, Number(this.quantityChange.value) + 1);
    });

    this.minusButton.removeEventListener("click", () => {
      this.changeQuantity(this.itemKey, Number(this.quantityChange.value) - 1);
    });

    this.quantityChange.removeEventListener("change", () => {
      this.changeQuantity(this.itemKey, Number(this.quantityChange.value));
    });
  }

  removeItem(itemKey) {
    this.changeQuantity(itemKey, 0);
  }

  changeQuantity(key, quantity) {
    this.changeItem({
      id: key,
      quantity,
      sections: "main-cart-mini,cart-count",
    }, this.line);
  }

  changeItem(newItem, line) {
    fetch(`${window.Shopify.routes.root}?sections=cart-content`)
    .then((response) => response.json())
    .then((response) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = response['cart-content'];
      const cartScript = tempDiv.querySelector('script[type="application/json"]');
      const cartData = JSON.parse(cartScript.textContent);

      const cartVariantQuantities = {};
      const variantInventory = {};

      for (const item of cartData.cart.items) {
        if (item.components?.length) {
          for (const component of item.components) {
            const variantId = String(component.id);
            cartVariantQuantities[variantId] =
              (cartVariantQuantities[variantId] || 0) + component.quantity;
            variantInventory[variantId] = component.inventory_quantity;
          }
        } else {
          const variantId = String(item.id);
          cartVariantQuantities[variantId] =
            (cartVariantQuantities[variantId] || 0) + item.quantity;
          variantInventory[variantId] = item.inventory_quantity;
        }
      }

      const cartLine = cartData.cart.items[Number(line)];
      const newQuantity = parseInt(newItem.quantity, 10);
      const delta = cartLine ? newQuantity - cartLine.quantity : 0;
      let hasInventoryError = false;

      if (cartLine && delta > 0) {
        if (cartLine.components?.length) {
          for (const component of cartLine.components) {
            const variantId = String(component.id);
            const perUnitQty = component.quantity / cartLine.quantity;
            const needed = perUnitQty * delta;
            const inCart = cartVariantQuantities[variantId] || 0;
            const inventoryQuantity = variantInventory[variantId];
            if (inventoryQuantity != null && inCart + needed > inventoryQuantity) {
              hasInventoryError = true;
              break;
            }
          }
        } else {
          const variantId = String(cartLine.id);
          const inCart = cartVariantQuantities[variantId] || 0;
          const inventoryQuantity = variantInventory[variantId];
          if (inventoryQuantity != null && inCart + delta > inventoryQuantity) {
            hasInventoryError = true;
          }
        }
      }

      if (hasInventoryError) {
        this.errorMessage.classList.remove("hidden");
        this.errorMessage.textContent = window.translations.out_of_stock;

        setTimeout(() => {
          this.errorMessage.classList.add("hidden");
          this.errorMessage.textContent = '';
        }, 3000);
        return;
      }

      return fetch(`${window.Shopify.routes.root}cart/change.js`, {
        body: JSON.stringify(newItem),
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/json",
        },
      });
    })
      .then((response) => response?.json())
      .then((data) => {
        if (!data) return;

        document.dispatchEvent(
          new CustomEvent("cart:change", {
            detail: {
              data,
              cartNotification: false,
            },
            bubbles: true,
          })
        );
      })
      .catch((error) =>
        console.error("Error updating mini-cart section:", error)
      );
  }
}

customElements.define("cart-item", CartItem);
