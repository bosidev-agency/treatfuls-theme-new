import axios from "axios";
import qs from "qs";

const configHeader = {
	headers: {
		Accept: "*/*",
		"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
		"X-Requested-With": "XMLHttpRequest"
	}
};

const URL = {
	objectJson: "/cart?view=object-json",
	add: "/cart/add.js",
	change: "/cart/change.js"
};

const cartApi = {
	async getCart() {
		const response = (await axios.get(URL.objectJson)).data;
		const html = document.createElement("div");
		html.innerHTML = response;

		return JSON.parse(html.querySelector("[data-json-response]").innerHTML);
	},
	addItem(item) {
		return this.addItems([item]).then((response) => response.data);
	},
	addItems(items = []) {
		return axios.post(URL.add, qs.stringify({ items }), configHeader);
	},
	changeItem(newItem) {
		return axios
			.post(URL.change, qs.stringify(newItem), configHeader)
			.then((res) => res.data);
	},
	changeQuantity(key, quantity) {
		return this.changeItem({
			id: key,
			quantity
		});
	},
	removeItem(key) {
		return this.changeQuantity(key, 0);
	}
};

export default cartApi;
