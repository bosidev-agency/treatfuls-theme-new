import { register } from "@shopify/theme-sections";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import { getRandomBetween } from "../../utils/helpers";

Swiper.use([Navigation]);

const selectors = {
	dataTitles: "[data-home-products-title]",
	slider: ".js-home-products-slider",
	slide: ".swiper-slide",
	body: "[data-site-body]",
	classOpacity: "opacity-0"
};

register("home-products", {
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
		const slider = this.container.querySelector(selectors.slider);
		const slides = this.container.querySelectorAll(selectors.slide);
		const randomNumber = getRandomBetween(1, slides.length);

		this.displayRandomTitle();
		this.initSlider(slider, randomNumber);
	},
	initSlider(selector, randomNumber) {
		const container = this.container;
    const sectionContainer = container.closest('.shopify-section');
		// const header = document.querySelector('#shopify-section-header');
    // const announcementBar = document.querySelector('#shopify-section-announcement-bar');
    // const ticker = document.querySelector('.home-ticker').closest('.shopify-section');

		this.slider = new Swiper(selector, {
			loop: true,
			centeredSlides: true,
			initialSlide: randomNumber,
			grabCursor: true,
			modules: [Navigation],
			navigation: {
				nextEl: container.querySelector(".home-products__nav--next"),
				prevEl: container.querySelector(".home-products__nav--prev")
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
        },
        slideChange: function () {
          if (container.dataset.adjustColorsToCurrentSlide === 'false') {
            return;
          }

					setTimeout(() => {
						const currentSlide =
							container.querySelector(`.swiper-slide-active`);
            const colorScheme = JSON.parse(currentSlide.getAttribute('data-slide-color'));
            sectionContainer.style.setProperty('--section-background-color', colorScheme.background);
            sectionContainer.style.setProperty('--section-accent-color', colorScheme.accent);
            sectionContainer.style.setProperty('--section-hover-color', colorScheme.hover);   
            // header.style.setProperty('--header-background-color', colorScheme.background);
            // header.style.setProperty('--header-accent-color', colorScheme.accent);
            // header.style.setProperty('--header-hover-color', colorScheme.hover);
            // announcementBar.style.setProperty('--header-accent-color', colorScheme.accent);
            // ticker.style.setProperty('--section-background-color', colorScheme.accent);
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
	},
	displayRandomTitle() {
		const title = this.container.querySelector(selectors.dataTitles);
		const stringOfTitles = title.dataset.homeProductsTitle;
		const arrOfTitles = stringOfTitles.split("##");
		const randomNumber = getRandomBetween(1, arrOfTitles.length);

		title.innerHTML = arrOfTitles[randomNumber - 1];
	}
});
