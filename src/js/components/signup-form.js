class SignUpForm extends HTMLElement {
  constructor() {
    super();
    this.signUpForm = this.querySelector("form");
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.signUpForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const url = "https://a.klaviyo.com/api/profiles/";
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          revision: "2024-07-15",
          "content-type": "application/json",
          Authorization: "Klaviyo-API-Key your-private-api-key",
        },
        body: JSON.stringify({
          data: {
            type: "profile",
            attributes: {
              properties: {
                email: "info@bosidev.com",
                first_name: "Bastian",
              },
            },
          },
        }),
      };

      fetch(url, options)
        .then((res) => res.json())
        .then((json) => console.log(json))
        .catch((err) => console.error("error:" + err));
    });
  }
}

customElements.define("sign-up-form", SignUpForm);
