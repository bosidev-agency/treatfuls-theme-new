// require("./vendor/vendor");

import "es6-promise/auto";
import objects from "./core/objects";
import translations from "@savchukoleksii/shopify-theme-translations-tool";
import settings from "@savchukoleksii/shopify-theme-settings-tool";
import * as sections from "@shopify/theme-sections";

const DOMContentLoadedPromise = new Promise((resolve) => {
	document.addEventListener("DOMContentLoaded", async () => {
		resolve();
	});
});

import * as bodyScrollLock from "body-scroll-lock";
global.bodyScrollLock = bodyScrollLock;

import $ from "jquery";
global.jQuery = $;
global.$ = $;

window.theme = window.theme || {};

/*================ Components ================*/
require("./components/lazy-load-images");
require("./components/not-found");
require("./components/accordion");

/*================ Sections ================*/
require("./sections/header");
require("./sections/cart");
require("./sections/minicart");
require("./sections/product");
require("./sections/ingredients");
require("./sections/home/richtext");
require("./sections/home/products");
require("./sections/home/ticker");
require("./sections/collections");
require("./sections/advantages");
require("./sections/about-us");

/*================ Templates ================*/
require("./templates/customers-addresses");
require("./templates/customers-login");

(async () => {
	try {
		await Promise.all([
			translations.load(),
			objects.load(),
			settings.load(),
			DOMContentLoadedPromise
		]);

		document.dispatchEvent(new CustomEvent("theme:all:loaded"));
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn(`catch error ----------`, error);
	}

	sections.load("*");
})();
