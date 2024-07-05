import Swiper from "swiper";

if (!customElements.get("collection-slider")) {
  customElements.define(
    "collection-slider",
    class CollectionSlider extends HTMLElement {
      constructor() {
        super();
        this.slider = null;
      }

      connectedCallback() {
        this.init();
      }

      disconnectedCallback() {
        this.slider.destroy(true, true);
      }

      init() {
        this.slider = new Swiper(this, {
          loop: false,
          centerMode: false,
          slidesPerView: 'auto',
          spaceBetween: 12,
          breakpoints: {
            769: {
              slidesPerView: 4,
              spaceBetween: 36,
            }
          }
        });
      }
    }
  );
}
