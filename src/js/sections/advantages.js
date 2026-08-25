import { register } from "@shopify/theme-sections";
import Swiper from "swiper";

const selectors = {
	advantagesSlider: "[data-advantages-slider]"
};

register("advantages", {
	slider: null,
	mediaQuery: null,
	onMediaChange: null,
	onLoad() {
		this.init();
	},
	onUnload() {
		if (this.mediaQuery && this.onMediaChange) {
			this.mediaQuery.removeEventListener("change", this.onMediaChange);
		}
		this.destroySlider();
	},
	init() {
		this.mediaQuery = window.matchMedia("(max-width: 767px)");
		this.onMediaChange = this.handleMediaChange.bind(this);
		this.mediaQuery.addEventListener("change", this.onMediaChange);
		this.handleMediaChange(this.mediaQuery);
	},

	destroySlider() {
		if (this.slider && typeof this.slider.destroy === "function") {
			this.slider.destroy(true, true);
			this.slider = null;
		}
	},

	initSlider() {
		if (this.slider) {
			return;
		}

		const sliderEl = this.container.querySelector(selectors.advantagesSlider);

		if (!sliderEl) {
			return;
		}

		this.slider = new Swiper(sliderEl, {
			loop: true,
			slidesPerView: "auto",
			centeredSlides: true,
			breakpoints: {
				300: {
					slidesPerView: 2.2
				},
				400: {
					slidesPerView: 2.2
				},
				500: {
					slidesPerView: 3.5
				}
			}
		});
	},

	handleMediaChange(e) {
		if (e.matches) {
			this.initSlider();
		} else {
			this.destroySlider();
		}
	}
});
