import serialize from "form-serialize";

export function addToCartSubmit(event, cartNotification = false) {
  event.preventDefault();

  const form = event.target;

  form.classList.add("adding");

  // The Shopify /cart/add.js endpoint expects url-encoded form data,
  // not a JSON body. That's why JSON.stringify(formData) doesn't work.
  // Instead, we need to send it as FormData or url-encoded.
  // Here's how to send as FormData:

  const formData = new FormData(form);

  formData.append("sections", "main-cart-mini,cart-count");

  fetch(`${window.Shopify.routes.root}?sections=cart-content`)
    .then((response) => response.json())
    .then((response) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = response["cart-content"];
      const cartScript = tempDiv.querySelector(
        'script[type="application/json"]',
      );
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

      const quantityToAdd = parseInt(formData.get("quantity"), 10) || 1;
      const bundleData = formData.get("properties[_bundleData]");
      let hasInventoryError = false;

      if (bundleData) {
        for (const component of JSON.parse(bundleData)) {
          const variantId = String(component.id).split("/").pop();
          const needed = component.quantity * quantityToAdd;
          const inCart = cartVariantQuantities[variantId] || 0;
          const inventoryQuantity = variantInventory[variantId];
          if (
            inventoryQuantity != null &&
            inCart + needed > inventoryQuantity
          ) {
            hasInventoryError = true;
            break;
          }
        }
      } else {
        const variantId = String(formData.get("id"));
        const inCart = cartVariantQuantities[variantId] || 0;
        const inventoryQuantity = variantInventory[variantId];
        if (
          inventoryQuantity != null &&
          inCart + quantityToAdd > inventoryQuantity
        ) {
          hasInventoryError = true;
        }
      }

      if (hasInventoryError) {
        form.querySelector(".error-message").classList.remove("hidden");
        form.querySelector(".error-message").textContent =
          window.translations.out_of_stock;

        setTimeout(() => {
          form.querySelector(".error-message").classList.add("hidden");
          form.querySelector(".error-message").textContent = '';
        }, 3000);
        return;
      }
    });

  fetch(`${window.Shopify.routes.root}cart/add.js`, {
    body: formData,
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      // Note: Do NOT set Content-Type when sending FormData; browser will handle it.
    },
  })
    .then((response) => response.json())
    .then((data) => {
      document.dispatchEvent(
        new CustomEvent("cart:change", {
          detail: {
            data,
            cartNotification,
          },
          bubbles: true,
        }),
      );
    })
    .catch((error) =>
      console.error("Error updating mini-cart section:", error),
    );
}
