import { register } from "@shopify/theme-sections";
import Vue from "vue";
import "../vue/filters";
import { store } from "../vue/store";
import { cartActions } from "../vue/store/cart/types";
import Cart from "../vue/Cart";

const selectors = {
	sectionData: "[data-section-data]"
};

register("cart", {
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
			render: (h) => h(Cart)
		}).$mount(this.container);
	}
});
