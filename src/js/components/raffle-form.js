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

  static firstEmptyUploadField(form) {
    return [...form.querySelectorAll("[data-require-upload]")].find(
      (el) => !el.value?.trim(),
    );
  }

  static uploadFieldError(field) {
    return field
      ?.closest(".field__upload")
      ?.querySelector(".contact-form__upload-error");
  }

  static syncQuestionAnswers(root) {
    root.querySelectorAll("[data-raffle-field-name]").forEach((group) => {
      const name = group.dataset.raffleFieldName;
      const type = group.dataset.raffleInputType || "radio";
      group.querySelectorAll("[data-raffle-answer]").forEach((input) => {
        input.name = name;
        input.type = type;
        input.closest(".input-choice")?.classList.add(`input-${type}`);
      });
    });
  }

  bindUploaders() {
    this.querySelectorAll("uc-upload-ctx-provider").forEach((provider) => {
      const field = provider
        .closest(".field__upload")
        ?.querySelector("[data-require-upload], input[type='hidden']");

      provider.addEventListener("file-url-changed", (e) => {
        if (field) field.value = e.detail.cdnUrl || "";
        this.updateSubmitButtonState();
      });

      provider.addEventListener("file-removed", () => {
        if (field) field.value = "";
        this.updateSubmitButtonState();
      });
    });
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
    form.querySelectorAll("[data-require-upload]").forEach((el) => {
      if (el.value?.trim()) {
        RaffleForm.uploadFieldError(el)?.classList.add("hidden");
      }
    });
  }

  connectedCallback() {
    this.raffleForm = this.querySelector(
      'form[action="/apps/raffle-form"]',
    );
    this.submitButton = this.querySelector('button[type="submit"]');
    this.postSuccessAnchor = this.dataset.postSuccessAnchor;
    this.successMessage = this.querySelector(".raffle-form__success-message");
    this.errorMessage = this.querySelector(".raffle-form__error-message");

    if (!this.raffleForm) return;

    RaffleForm.syncQuestionAnswers(this);
    this.bindUploaders();

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

    const emptyUpload = RaffleForm.firstEmptyUploadField(form);
    if (emptyUpload) {
      RaffleForm.uploadFieldError(emptyUpload)?.classList.remove("hidden");
      emptyUpload.closest(".field__upload")?.scrollIntoView({
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
