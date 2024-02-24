import Vue from "vue";
import Vuex from "vuex";
import cart from "./cart";

Vue.use(Vuex);

export const store = new Vuex.Store({
	modules: {
		cart
	}
});
