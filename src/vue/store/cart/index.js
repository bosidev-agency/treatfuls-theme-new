import settings from "../../../core/settings";
import cartApi from "../../api/cart";

import { cartActions, cartMutations, cartGetters } from "./types";

const getDefaultState = () => ({
	loading: true,
	cart: { items: [] },
	settings: {}
});

const state = getDefaultState();

const getters = {
	[cartGetters.CART]: (state) => state.cart,
	[cartGetters.SETTINGS]: (state) => state.settings
};

const mutations = {
	[cartMutations.UPDATE_CART]: (state, cart) => {
		cart.item_count = Object.values(cart.items).reduce(
			(total, item) => total + item.quantity,
			0
		);

		cart.items.forEach((item) => {
			if (item.properties === null) {
				item.filteredProperties = {};

				return null;
			}

			const properties = Object.keys(item.properties);
			if (properties.includes("_original_variant")) {
				const original_variant = item.properties["_original_variant"];

				item.url = original_variant.url;
			}

			item.filteredProperties = properties.reduce((result, property) => {
				if (property.startsWith("_")) {
					return result;
				}

				if (
					[
						"shipping_interval_unit_type",
						"shipping_interval_frequency"
					].includes(property)
				) {
					return result;
				}

				result[property] = item.properties[property];
				return result;
			}, {});

			if (
				properties.includes("shipping_interval_unit_type") &&
				properties.includes("shipping_interval_frequency")
			) {
				item.filteredProperties[
					"Subscription"
				] = `${item.properties["shipping_interval_frequency"]} ${item.properties["shipping_interval_unit_type"]}`;
			}
		});

		document.dispatchEvent(
			new CustomEvent("cart:item_count", {
				detail: {
					item_count: cart.item_count
				}
			})
		);

		state.cart = cart;
	},
	[cartMutations.UPDATE_LOADING]: (state, loading) => {
		state.loading = loading;
	},
	[cartMutations.UPDATE_SETTINGS]: (state, settings) => {
		state.settings = settings;
	}
};

const actions = {
	[cartActions.INIT_CART]: async (context) => {
		context.commit(cartMutations.UPDATE_LOADING, true);
		context.commit(cartMutations.UPDATE_SETTINGS, settings.all());

		await context.dispatch(cartActions.GET_CART);

		context.commit(cartMutations.UPDATE_LOADING, false);
	},
	[cartActions.GET_CART]: async (
		context,
		{ errorCallback = () => {} } = {}
	) => {
		context.commit(cartMutations.UPDATE_LOADING, true);

		try {
			const cart = await cartApi.getCart();

			context.commit(cartMutations.UPDATE_CART, cart);
			context.commit(cartMutations.UPDATE_LOADING, false);
		} catch (error) {
			await errorCallback(error);
		}
	},
	[cartActions.ADD_TO_CART]: async (
		context,
		{ products, errorCallback = () => {} } = {}
	) => {
		context.commit(cartMutations.UPDATE_LOADING, true);

		try {
			await cartApi.addItems(products);

			await context.dispatch(cartActions.GET_CART);

			context.commit(cartMutations.UPDATE_LOADING, false);

			document.dispatchEvent(
				new CustomEvent("track:cart:added", {
					detail: {
						// find items
					}
				})
			);
		} catch (error) {
			await errorCallback(error);
		}
	},
	[cartActions.REMOVE_ITEM]: async (
		context,
		{ key, errorCallback = () => {} } = {}
	) => {
		context.commit(cartMutations.UPDATE_LOADING, true);

		try {
			await cartApi.removeItem(key);

			await context.dispatch(cartActions.GET_CART);

			context.commit(cartMutations.UPDATE_LOADING, false);

			const item = context.state.cart.items.find((item) => {
				return item.key === key;
			});

			document.dispatchEvent(
				new CustomEvent("track:cart:removed", {
					detail: {
						item
					}
				})
			);
		} catch (error) {
			await errorCallback(error);
		}
	},
	[cartActions.CHANGE_QUANTITY]: async (
		context,
		{ key, quantity, errorCallback = () => {} } = {}
	) => {
		context.commit(cartMutations.UPDATE_LOADING, false);

		try {
			await cartApi.changeQuantity(key, quantity);

			await context.dispatch(cartActions.GET_CART);

			context.commit(cartMutations.UPDATE_LOADING, false);

			const item = context.state.cart.items.find((item) => {
				return item.key === key;
			});

			document.dispatchEvent(
				new CustomEvent("track:cart:changed-quantity", {
					detail: {
						item
					}
				})
			);
		} catch (error) {
			await errorCallback(error);
		}
	}
};

export default {
	namespaced: true,
	state,
	getters,
	mutations,
	actions
};
