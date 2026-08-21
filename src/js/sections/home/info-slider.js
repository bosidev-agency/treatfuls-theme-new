import { register } from "@shopify/theme-sections";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";

Swiper.use([Navigation]);

const selectors = {
	slider: ".js-info-slider",
	wrapper: ".swiper-container-wrapper",
	classOpacity: "opacity-0",
	classNoNav: "info-slider__wrapper--no-nav"
};

const updateNavigation = (wrapper, swiper, slideCount) => {
	if (!wrapper) {
		return;
	}

	const slidesPerView = Number(swiper.params.slidesPerView);
	const needsNav = Number.isFinite(slidesPerView) && slideCount > slidesPerView;

	wrapper.classList.toggle(selectors.classNoNav, !needsNav);
};

register("info-slider", {
	slider: null,
	onLoad() {
		this.init();
	},
	onUnload() {
		this.destroySlider();
	},
	init() {
		const slider = this.container.querySelector(selectors.slider);

		if (!slider) {
			return;
		}

		this.initSlider(slider);
	},
	initSlider(selector) {
		const container = this.container;
		const wrapper = container.querySelector(selectors.wrapper);
		const slideCount = selector.querySelectorAll(".swiper-slide").length;

		this.slider = new Swiper(selector, {
			loop: slideCount > 4,
			watchOverflow: true,
			centeredSlides: true,
			grabCursor: true,
			modules: [Navigation],
			navigation: {
				nextEl: container.querySelector(".info-slider__nav--next"),
				prevEl: container.querySelector(".info-slider__nav--prev")
			},
			breakpoints: {
				300: {
					slidesPerView: 1.5,
					centeredSlides: true,
					spaceBetween: 0
				},
				767: {
					slidesPerView: 1.7,
					centeredSlides: true,
					spaceBetween: 0
				},
				992: {
					slidesPerView: 4,
					slidesPerGroup: 1,
					centeredSlides: false,
					spaceBetween: 40
				}
			},
			on: {
				init: function () {
					const slider = container.querySelector(selectors.slider);

					if (slider.classList.contains(selectors.classOpacity)) {
						slider.classList.remove(selectors.classOpacity);
					}

					updateNavigation(wrapper, this, slideCount);
				},
				breakpoint: function () {
					updateNavigation(wrapper, this, slideCount);
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
