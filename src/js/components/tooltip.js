class ToolTip extends HTMLElement {
  constructor() {
    super();
    this.tooltipId = this.dataset.id;
    this.tooltipElement = this.querySelector(".gallery-item__tooltip");
    this.tooltipTrigger = document.querySelector(
      `[data-tooltip-trigger="${this.tooltipId}"]`
    );
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.debounceResize = this.debounce(this.positionTooltip.bind(this), 200); // debounce for 200ms
  }

  connectedCallback() {
    // Set the tooltip position once on page load
    this.positionTooltip();
    window.addEventListener("resize", this.debounceResize);

    this.tooltipTrigger.addEventListener("mouseenter", this.handleMouseEnter);
    this.tooltipTrigger.addEventListener("mouseleave", this.handleMouseLeave);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.debounceResize);
    this.tooltipTrigger.removeEventListener(
      "mouseenter",
      this.handleMouseEnter
    );
    this.tooltipTrigger.removeEventListener(
      "mouseleave",
      this.handleMouseLeave
    );
  }

  handleMouseEnter() {
    this.positionTooltip();
    this.setAttribute("visible", "");
  }

  handleMouseLeave() {
    this.removeAttribute("visible");
  }

  positionTooltip() {
    const triggerRect = this.tooltipTrigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Determine horizontal position
    if (triggerRect.left + triggerRect.width / 2 < viewportWidth / 2) {
      // Closer to the left side
      this.style.left = `${triggerRect.left + triggerRect.width / 2}px`;
      this.style.transform = "translateX(0)";
    } else {
      // Closer to the right side
      this.style.left = `${triggerRect.left + triggerRect.width / 2}px`;
      this.style.transform = "translateX(-100%)";
    }

    // Determine vertical position
    if (triggerRect.top + triggerRect.height / 2 < viewportHeight / 2) {
      // Closer to the top
      this.style.top = `${triggerRect.top + triggerRect.height}px`;
      this.style.transform += " translateY(0)";
    } else {
      // Closer to the bottom
      this.style.top = `${triggerRect.top}px`;
      this.style.transform += " translateY(-100%)";
    }
  }

  // Debounce function to limit how often the positionTooltip is called
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
}

customElements.define("tool-tip", ToolTip);