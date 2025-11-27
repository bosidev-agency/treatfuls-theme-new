import serialize from "form-serialize";

export function addToCartSubmit(event) {
  event.preventDefault();

  const form = event.target;

  form.classList.add("adding");

  // The Shopify /cart/add.js endpoint expects url-encoded form data,
  // not a JSON body. That's why JSON.stringify(formData) doesn't work.
  // Instead, we need to send it as FormData or url-encoded.
  // Here's how to send as FormData:

  const formData = new FormData(form);

  formData.append('sections', 'main-cart-mini,cart-count');

  fetch(`${window.Shopify.routes.root}cart/add.js`, {
    body: formData,
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest"
      // Note: Do NOT set Content-Type when sending FormData; browser will handle it.
    },
  })
    .then((response) => response.json())
    .then((data) => {
      document.dispatchEvent(
        new CustomEvent("cart:change", {
          detail: data,
          bubbles: true,
        })
      );
    })
    .catch((error) =>
      console.error("Error updating mini-cart section:", error)
    );
}
