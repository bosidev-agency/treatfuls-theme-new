const KLAVIYO_TIMEOUT_MS = 2500;

function isValidEmail(value) {
  return typeof value === "string" && value.trim().length > 0 && value.includes("@");
}

async function klaviyoEmailOptIn({
  companyId,
  listId,
  email,
  source = "newsletter",
  signal,
}) {
  const res = await fetch(
    `https://a.klaviyo.com/client/subscriptions?company_id=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/vnd.api+json",
        revision: "2024-07-15",
      },
      body: JSON.stringify({
        data: {
          type: "subscription",
          attributes: {
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: email,
                },
              },
            },
            custom_source: source,
          },
          relationships: {
            list: { data: { type: "list", id: listId } },
          },
        },
      }),
      signal,
    }
  );
  if (!res.ok) throw new Error(`Klaviyo opt-in failed (${res.status})`);
  return res.json();
}

class RaffleForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.uploadcare = this.querySelector("uc-upload-ctx-provider");
    this.raffleForm = this.querySelector(
      'form[action="/contact#contact_form"]',
    );
    this.reciptInput = this.querySelector('input[name="contact[Kassenbon]"]');
    this.submitButton = this.querySelector('button[type="submit"]');
    this.uploadError = this.querySelector(".contact-form__upload-error");
    this.newsletterSignupCheckbox = this.querySelector('#NewsletterSignup');

    this.uploadcare.addEventListener("file-url-changed", (e) => {
      this.reciptInput.value = e.detail.cdnUrl;
      this.submitButton.disabled = false;
    });

    this.uploadcare.addEventListener("file-removed", (e) => {
      this.reciptInput.value = "";
      this.submitButton.disabled = true;
    });

    this.raffleForm.addEventListener("submit", async (event) => {
      // Allow programmatic submit to proceed (after Klaviyo call)
      if (this.programmaticSubmit) {
        this.programmaticSubmit = false;
        this.submitting = false;
        return;
      }

      // One-time submit guard: prevent double submits
      if (this.submitting) {
        event.preventDefault();
        return;
      }

      if (this.reciptInput.value === "") {
        event.preventDefault();
        this.uploadError.classList.remove("hidden");
        return;
      }

      const companyId = this.dataset.klaviyoCompanyId?.trim();
      const listId = this.dataset.klaviyoListId?.trim();
      const emailInput = this.raffleForm.querySelector('input[name="contact[E-Mail]"]');
      const email = emailInput?.value?.trim();

      const shouldOptIn =
        this.newsletterSignupCheckbox?.checked &&
        companyId &&
        listId &&
        isValidEmail(email);

      if (shouldOptIn) {
        event.preventDefault();
        this.submitting = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), KLAVIYO_TIMEOUT_MS);
        try {
          await klaviyoEmailOptIn({
            companyId,
            listId,
            email,
            source: "raffle",
            signal: controller.signal,
          });
        } catch (err) {
          console.warn("Klaviyo newsletter signup failed:", err);
        } finally {
          clearTimeout(timeoutId);
          this.submitting = false;
          this.programmaticSubmit = true;
          this.raffleForm.requestSubmit();
        }
      }
    });
  }
}

customElements.define("raffle-form", RaffleForm);
