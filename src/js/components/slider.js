import Swiper from 'swiper';

class SliderElement extends HTMLElement {
  constructor() {
    super();
    this.sliderConfig = this.dataset.swiperConfig ? JSON.parse(this.dataset.swiperConfig) : {};
    this.swiperInstance = null;
    this.mediaQuery = window.matchMedia('(max-width: 991px)');
    this.handleResize = this.handleResize.bind(this);
  }

  connectedCallback() {
    this.handleResize(this.mediaQuery); // Check initial screen size
    this.mediaQuery.addEventListener('change', this.handleResize); // Add listener for screen size changes
  }

  disconnectedCallback() {
    this.mediaQuery.removeEventListener('change', this.handleResize); // Remove listener when element is removed
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true); // Destroy Swiper instance if it exists
    }
  }

  handleResize(e) {
    if (e.matches) {
      // Screen width is <= 991px
      if (!this.swiperInstance) {
        this.swiperInstance = new Swiper(this, this.sliderConfig);
      }
    } else {
      // Screen width is > 991px
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }
    }
  }
}

customElements.define('slider-element', SliderElement);