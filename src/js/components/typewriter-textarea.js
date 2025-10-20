class TypewriterTextarea extends HTMLTextAreaElement {
  constructor() {
    super();
    this.originalPlaceholder = "";
    this.isTyping = false;
    this.typewriterInterval = null;
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.stopTypewriter();
  }

  init() {
    // Store the original placeholder
    this.originalPlaceholder = this.placeholder || "";

    // Start the typewriter effect
    this.startTypewriter();
  }

  addToPlaceholder(toAdd) {
    this.placeholder = this.placeholder + toAdd;
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  clearPlaceholder() {
    this.placeholder = "";
  }

  printPhrase(phrase) {
    return new Promise((resolve) => {
      this.clearPlaceholder();
      let letters = phrase.split("");

      letters.reduce(
        (promise, letter, index) =>
          promise.then(() => {
            if (index === letters.length - 1) {
              setTimeout(resolve, 1000);
            }
            return this.addToPlaceholder(letter);
          }),
        Promise.resolve()
      );
    });
  }

  printPhrases(phrases) {
    return phrases.reduce(
      (promise, phrase) => promise.then(() => this.printPhrase(phrase)),
      Promise.resolve()
    );
  }

  startTypewriter() {
    if (!this.originalPlaceholder || this.isTyping) {
      return;
    }

    this.isTyping = true;
    this.typewriterLoop();
  }

  stopTypewriter() {
    this.isTyping = false;
    if (this.typewriterInterval) {
      clearTimeout(this.typewriterInterval);
      this.typewriterInterval = null;
    }
  }

  typewriterLoop() {
    if (!this.isTyping) {
      return;
    }

    // Create an array with the placeholder text repeated 3 times for the loop effect
    const phrases = [
      this.originalPlaceholder,
      this.originalPlaceholder,
      this.originalPlaceholder,
    ];

    this.printPhrases(phrases).then(() => {
      if (this.isTyping) {
        // After 3 loops, display the full placeholder and stop
        this.placeholder = this.originalPlaceholder;
        this.stopTypewriter();
      }
    });
  }

  // Method to update the placeholder and restart typewriter
  updatePlaceholder(newPlaceholder) {
    this.originalPlaceholder = newPlaceholder;
    this.stopTypewriter();
    this.startTypewriter();
  }
}

customElements.define("textarea-typewriter", TypewriterTextarea, {
  extends: "textarea",
});
