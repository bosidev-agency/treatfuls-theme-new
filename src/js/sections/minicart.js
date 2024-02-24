import { register } from "@shopify/theme-sections";
import Vue from "vue";
import "../vue/filters";
import { store } from "../vue/store";
import { cartActions } from "../vue/store/cart/types";
import MinicartVue from "../vue/Minicart";
import { templateEquals } from "@savchukoleksii/shopify-template-checker";

const selectors = {
	sectionData: "[data-section-data]"
};

document.addEventListener("product:add", async function (event) {
	const detail = event.detail;

	if (!detail) {
		return null;
	}

	const items = detail.items;
	if (!items) {
		return null;
	}

	const errorCallback =
		typeof event.detail.errorCallback === "function"
			? event.detail.errorCallback
			: () => {};

	await store.dispatch(`cart/${cartActions.ADD_TO_CART}`, {
		products: event.detail.items,
		errorCallback
	});

	const callback = detail.callback;

	if (typeof callback === "function") {
		await callback();
	}

	document.dispatchEvent(new CustomEvent("open:minicart"));
});

if (!templateEquals("cart")) {
	register("minicart", {
		minicartOpeners: null,
		onLoad: function () {
			this.init();
		},
		init: async function () {
			const sectionData = JSON.parse(
				this.container.querySelector(selectors.sectionData).innerHTML
			);

			await store.dispatch(`cart/${cartActions.INIT_CART}`);

			new Vue({
				store,
				data: () => ({ ...sectionData }),
				render: (h) => h(MinicartVue)
			}).$mount(this.container);

			this.minicartOpeners = Array.prototype.slice.call(
				document.querySelectorAll("[data-minicart-opener]")
			);

			this.initEvents();
		},
		initEvents: function () {
			if (!this.minicartOpeners) {
				return;
			}

			this.minicartOpeners.forEach((opener) => {
				opener.addEventListener("click", this.open.bind(this));
			});
		},
		open: function (e) {
			e.preventDefault();

			document.dispatchEvent(new CustomEvent("open:minicart"));
		}
	});
}
