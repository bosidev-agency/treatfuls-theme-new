import { register } from "@shopify/theme-sections";
import Swiper from "swiper";

const selectors = {
	slider: ".js-collection-products-slider",
	slide: ".swiper-slide",
	body: "[data-site-body]",
	classOpacity: "opacity-0"
};

register("collection-products", {
	slider: null,
	bodyElement: null,
	onLoad() {
		this.bodyElement = document.body;
		this.init();
	},
	onUnload() {
		this.destroySlider();
	},
	init() {
		this.initSlider(this.container.querySelector(selectors.slider));
	},
	initSlider(selector) {
		const container = this.container;
		const body = this.bodyElement;

		this.slider = new Swiper(selector, {
			loop: true,
			centeredSlides: true,
			breakpoints: {
				300: {
					slidesPerView: 1.5
				},
				767: {
					slidesPerView: 1.7
				},
				1710: {
					slidesPerView: 1.85
				},
				1900: {
					slidesPerView: 2
				},
				2000: {
					slidesPerView: 2.1
				}
			},
			on: {
				init: function () {
					const slider = container.querySelector(selectors.slider);

					if (slider.classList.contains(selectors.classOpacity)) {
						slider.classList.remove(selectors.classOpacity);
					}
				},
				slideChange: function () {
					setTimeout(() => {
						const currentSlide =
							container.querySelector(`.swiper-slide-active`);

						body.dataset.siteBg = currentSlide.dataset.slideColor;
					}, 0);
				}
			}
		});
	},
	destroySlider() {
		if (this.slider && typeof this.slider.destroy === "function") {
			this.slider.destroy();
			this.slider = null;
		}
	}
});
