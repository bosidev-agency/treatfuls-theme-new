import Vue from "vue";
import translations from "@savchukoleksii/shopify-theme-translations-tool";
import settings from "@savchukoleksii/shopify-theme-settings-tool";
import objects from "../../js/core/objects";
import { formatMoney } from "@shopify/theme-currency";
import { getSizedImageUrl } from "@shopify/theme-images";

Vue.filter("money", function (value) {
	return formatMoney(value, "€{{amount}}");
});

Vue.filter("moneyNoDecimals", function (value) {
	return formatMoney(value, "€{{amount_no_decimals}}");
});

Vue.filter("img_url", function (src, size) {
	const settingsAll = settings.all();

	if (!src) {
		if (settingsAll.placeholder) {
			src = settingsAll.placeholder;
		} else {
			src = objects.get("imgUrl").replace("%%file%%", "no-image.gif");
		}
	}

	return getSizedImageUrl(src, size);
});

Vue.filter("asset_img_url", function (file, size = null) {
	const src = objects.get("assetsUrl").replace("%%file%%", file);

	if (!src) {
		return src;
	}

	if (!size) {
		return src;
	}

	return getSizedImageUrl(src, size);
});

Vue.filter("file_img_url", function (file, size = null) {
	const src = objects.get("fileUrl").replace("%%file%%", file);

	if (!src) {
		return src;
	}

	if (!size) {
		return src;
	}

	return getSizedImageUrl(src, size);
});

Vue.filter("t", function (value, params = {}) {
	return translations.get(value, params);
});

Vue.filter("unescape", function unescape(value) {
	const doc = new DOMParser().parseFromString(value, "text/html");

	return doc.documentElement.textContent;
});

Vue.filter("routes", function routes(value) {
	return objects.routes(value);
});

Vue.filter("default_value", function routes(value, defaultValue) {
	if (value) {
		return value;
	}

	return defaultValue;
});
