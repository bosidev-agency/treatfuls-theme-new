<template>
	<div
		class="minicart"
		:data-section-id="section.id"
		:data-section-type="section.type"
	>
		<div :class="{ 'minicart__overlay': true, 'minicart__overlay--shown': isOpened }" @click="closeCart"></div>

		<div class="minicart__container"
				 :class="{ 'minicart__container--open': isOpened }"
				 :style="{ height: getHeight }">
			<div class="minicart__wrapper">
				<div class="minicart__section minicart__section--header">
					<div class="minicart__header">
						<h3 class="minicart__title title-bg title-bg--quaternary title-bg--sm">
							<span><span>{{ 'cart.general.title' | t }}</span></span>
							<b v-if="!isEmptyMinicart">&nbsp{{ cart.item_count }} {{ 'cart.general.mini_cart_item' | t }}</b>
						</h3>
						<div class="minicart__close" @click="closeCart"></div>
					</div>
				</div>

				<div
					class="minicart__body"
					:class="{ 'minicart__body--empty': isEmptyMinicart }"
				>
					<EmptyMinicart
						:empty-button-text="section.settings.empty_button_text"
						:empty-button-url="section.settings.empty_button_url"
						v-if="isEmptyMinicart"
					/>

					<div
						v-else
						class="minicart__section minicart__section--items js-minicart-items"
					>
						<CartItem v-for="item in cart.items" :key="item.key" :item="item" :is-mini-cart="true" />
					</div>
				</div>

				<div class="minicart__section minicart__section--footer">
					<CartSubtotal
						v-if="!isEmptyMinicart"
						:cart="cart"
						:is-mini-cart="true"
						@closeCart="closeCart"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

import {createNamespacedHelpers} from 'vuex';
const { mapState, mapActions, mapGetters } = createNamespacedHelpers("cart");

import {cartGetters} from './store/cart/types';

import { CHECKOUT } from "../core/objects";
import sectionData from "./mixins/sectionData";
import mapFilters from "./filters/mapFilters";

import EmptyMinicart from "./components/EmptyMinicart";
import CartItem from "./components/CartItem";
import CartSubtotal from "./components/CartSubtotal";

let resizeChange = null;

export default {
		name: 'Minicart',
		mixins: [
			sectionData
		],
		data: () => ({
			isOpened: false,
			height: window.innerHeight,
			cartUrl: CHECKOUT,

			first_available_variant: null,
			current_variant: null
		}),
		mounted() {
			document.addEventListener('open:minicart', () => {
				this.openCart()
			});

			window.addEventListener('resize', () => {
				clearTimeout(resizeChange);

				resizeChange = setTimeout(() => {
					this.height = window.innerHeight;
				}, 50);
			});
		},
		computed: {
			...mapGetters({
				cart: cartGetters.CART,
				settings: cartGetters.SETTINGS,
			}),
			getHeight() {
				return `${this.height}px`;
			},
			isEmptyMinicart() {
				return this.cart.item_count === 0;
			}
		},
		methods: {
			...mapFilters([
				"file_img_url",
				"money"
			]),
			closeCart(e) {
				if (e) {
					e.preventDefault();
				}

				this.clearBodyScroll();

				this.isOpened = false;
			},
			openCart() {
				this.bodyScroll();

				this.isOpened = true;
			},
			clearBodyScroll() {
				bodyScrollLock.clearAllBodyScrollLocks();
				this.$el.querySelector('.js-minicart-items').scrollTo(0, 0);
			},
			bodyScroll() {
				bodyScrollLock.disableBodyScroll(this.$el.querySelector('.js-minicart-items'));
			},
		},
		components: {
			CartItem,
			EmptyMinicart,
			CartSubtotal
		}
	}
</script>
