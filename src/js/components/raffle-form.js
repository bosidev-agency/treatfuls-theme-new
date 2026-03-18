/**
 * Raffle form: submit enabled only when all native [required] fields validate
 * and every [data-require-selection] group has a choice (radio/checkbox)
 * and/or a filled [data-selection-alternative] inside that group.
 */
class RaffleForm extends HTMLElement {
  static isSelectionGroupComplete(group) {
    if (
      group.querySelector(
        'input[type="radio"]:checked, input[type="checkbox"]:checked',
      )
    ) {
      return true;
    }
    for (const el of group.querySelectorAll("[data-selection-alternative]")) {
      if (el.value?.trim()) return true;
    }
    return false;
  }

  static allSelectionGroupsValid(form) {
    return [...form.querySelectorAll("[data-require-selection]")].every(
      RaffleForm.isSelectionGroupComplete,
    );
  }

  static hideSelectionGroupErrors(form) {
    form.querySelectorAll("[data-selection-group-error]").forEach((el) => {
      el.classList.add("hidden");
    });
  }

  /** First invalid [data-require-selection], if any. */
  static firstInvalidSelectionGroup(form) {
    for (const group of form.querySelectorAll("[data-require-selection]")) {
      if (!RaffleForm.isSelectionGroupComplete(group)) return group;
    }
    return null;
  }

  /**
   * Hidden file URL fields marked data-require-upload (browsers ignore required on type=hidden).
   */
  static allUploadRequirementsMet(form) {
    const fields = form.querySelectorAll("[data-require-upload]");
    if (!fields.length) return true;
    return [...fields].every((el) => Boolean(el.value?.trim()));
  }

  updateSubmitButtonState() {
    const form = this.raffleForm;
    if (!form || !this.submitButton) return;

    const nativeOk = form.checkValidity();
    const selectionOk = RaffleForm.allSelectionGroupsValid(form);
    const uploadOk = RaffleForm.allUploadRequirementsMet(form);
    this.submitButton.disabled = !(nativeOk && selectionOk && uploadOk);

    if (selectionOk) {
      RaffleForm.hideSelectionGroupErrors(form);
    }
    if (uploadOk && this.uploadError) {
      this.uploadError.classList.add("hidden");
    }
  }

  connectedCallback() {
    this.uploadcare = this.querySelector("uc-upload-ctx-provider");
    this.raffleForm = this.querySelector(
      'form[action="/apps/raffle-form"]',
    );
    this.reciptInput = this.querySelector('input[name="Kassenbon"]');
    this.submitButton = this.querySelector('button[type="submit"]');
    this.uploadError = this.querySelector(".contact-form__upload-error");
    this.newsletterSignupCheckbox = this.querySelector("#NewsletterSignup");
    this.postSuccessAnchor = this.dataset.postSuccessAnchor;
    this.successMessage = this.querySelector(".raffle-form__success-message");
    this.errorMessage = this.querySelector(".raffle-form__error-message");

    this.uploadcare.addEventListener("file-url-changed", (e) => {
      if (this.reciptInput) {
        this.reciptInput.value = e.detail.cdnUrl || "";
      }
      this.updateSubmitButtonState();
    });

    this.uploadcare.addEventListener("file-removed", () => {
      if (this.reciptInput) this.reciptInput.value = "";
      this.updateSubmitButtonState();
    });

    this.raffleForm.addEventListener("input", () => {
      this.updateSubmitButtonState();
    });
    this.raffleForm.addEventListener("change", () => {
      this.updateSubmitButtonState();
    });

    this.raffleForm.addEventListener("submit", (event) => {
      this.handleSubmit(event);
    });

    this.updateSubmitButtonState();
  }

  async handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    RaffleForm.hideSelectionGroupErrors(form);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const invalidGroup = RaffleForm.firstInvalidSelectionGroup(form);
    if (invalidGroup) {
      invalidGroup
        .querySelector("[data-selection-group-error]")
        ?.classList.remove("hidden");
      invalidGroup.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!RaffleForm.allUploadRequirementsMet(form)) {
      this.uploadError?.classList.remove("hidden");
      this.querySelector(".field__upload")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

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
      this.updateSubmitButtonState();
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
    this.errorMessage.querySelector(".raffle-form__error-message-text").textContent =
      "Fehler: " + message;
    this.updateSubmitButtonState();
  }
}

customElements.define("raffle-form", RaffleForm);
