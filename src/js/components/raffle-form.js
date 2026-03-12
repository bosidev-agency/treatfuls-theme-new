class RaffleForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.uploadcare = this.querySelector("uc-upload-ctx-provider");
    this.raffleForm = this.querySelector(
      'form[action="/apps/raffle-form"]',
    );
    this.reciptInput = this.querySelector('input[name="Kassenbon"]');
    this.submitButton = this.querySelector('button[type="submit"]');
    this.uploadError = this.querySelector(".contact-form__upload-error");
    this.newsletterSignupCheckbox = this.querySelector('#NewsletterSignup');
    this.postSuccessAnchor = this.dataset.postSuccessAnchor;
    this.successMessage = this.querySelector(".raffle-form__success-message");
    this.errorMessage = this.querySelector(".raffle-form__error-message");

    this.uploadcare.addEventListener("file-url-changed", (e) => {
      this.reciptInput.value = e.detail.cdnUrl;
      this.submitButton.disabled = false;
    });

    this.uploadcare.addEventListener("file-removed", (e) => {
      this.reciptInput.value = "";
      this.submitButton.disabled = true;
    });

    this.raffleForm.addEventListener("submit", (event) => {
      this.handleSubmit(event);
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const form = event.currentTarget;
    this.submitButton.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      });
      const result = await response.json();
      
      if (result.success) {
        this.showSuccessMessage();
      } else {
        this.showErrorMessage(result.message);
      }

      this.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  showSuccessMessage() {
    this.successMessage.classList.remove("hidden");
    this.raffleForm.classList.add("hidden");
    this.submitButton.disabled = false;
  }

  showErrorMessage(message) {
    this.errorMessage.classList.remove("hidden");
    this.submitButton.disabled = false;
    this.errorMessage.querySelector(".raffle-form__error-message-text").textContent = 'Fehler: ' + message;
  }
}

customElements.define("raffle-form", RaffleForm);