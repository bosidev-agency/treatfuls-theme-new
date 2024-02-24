<template>
	<div class="cart content-wrapper" :class="{ 'cart--empty': isEmptyCart }" id="cart">
		<picture v-if="getLeftImage" class="cart__img cart__img--left">
			<source :srcset="getLeftImage | img_url('353x')" media="(min-width: 1920px)">
			<img :src="getLeftImage | img_url('236x')" :alt="''" />
		</picture>
		<div class="cart__wrap">
			<section class="cart__heading title-wrapper">
				<h1 class="cart__title title-wrapper__title title-bg title-bg--quaternary" v-html="getTitle"></h1>
				<p class="cart__subtitle title-wrapper__subtitle">{{ getSubTitle }}</p>
				<a v-if="isEmptyCart"
					 :href="section.settings.continue_shopping_url"
					 class="cart__link-empty text"
				>
					{{ 'cart.general.continue_shopping' | t }}
				</a>
			</section>

			<div class="cart__body" v-if="!isEmptyCart">
				<CartItem v-for="item in cart.items" :item="item" :key="item.key"/>
			</div>
			<div class="cart__footer">
				<CartSubtotal v-if="!isEmptyCart" :cart="cart"/>
			</div>
		</div>
		<picture v-if="getRightImage" class="cart__img cart__img--right">
			<source :srcset="getRightImage | img_url('352x')" media="(min-width: 1920px)">
			<img :src="getRightImage | img_url('235x')" :alt="''" />
		</picture>
	</div>
</template>

<script>
import {createNamespacedHelpers} from 'vuex';

const {mapGetters} = createNamespacedHelpers("cart");

import sectionData from "./mixins/sectionData";
import {CHECKOUT} from "../core/objects";
import {cartGetters} from './store/cart/types';

import CartItem from "./components/CartItem";
import CartSubtotal from "./components/CartSubtotal";

let resizeChange = null;
export default {
	name: 'Cart',
	mixins: [
		sectionData
	],
	data: () => ({
		isOpened: false,
		checkoutUrl: CHECKOUT
	}),
	computed: {
		...mapGetters({
			cart: cartGetters.CART,
			settings: cartGetters.SETTINGS
		}),
		isEmptyCart() {
			return this.cart.item_count === 0;
		},
		getTitle() {
			return this.isEmptyCart ? this.$options.filters.t('cart.general.mini_cart_empty_title') : this.section.settings.cart_title;
		},
		getSubTitle() {
			return this.isEmptyCart ? this.$options.filters.t('cart.general.mini_cart_empty_subtitle') : this.section.settings.cart_subtitle;
		},
		getLeftImage() {
			console.log('this.section.settings.image_left', this.section.settings);
			return this.section.settings.image_left ? this.section.settings.image_left : null;
		},
		getRightImage() {
			return this.section.settings.image_right ? this.section.settings.image_right : null;
		}
	},
	components: {
		CartItem,
		CartSubtotal
	}
};
</script>
