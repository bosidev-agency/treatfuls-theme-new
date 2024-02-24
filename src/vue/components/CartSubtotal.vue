<template>
	<div class="cart-order" :class="{ 'cart-order--mini': isMiniCart }">
		<div class="cart-order__heading h3">
			<span class="cart-order__title">{{ 'cart.general.cart_subtotal' | t }}</span>
			<span class="cart-order__total">{{ cart.total_price | money }}</span>
		</div>
		<div class="cart-order__actions">
			<a :href="checkoutUrl | routes"
				 class="cart-order__button button button--tertiary">
				{{ 'cart.general.checkout' | t }}
			</a>
		<button
			v-if="isMiniCart"
			@click="closeMiniCart"
			class="cart-order__link"
		>
			{{ 'cart.general.continue_shopping' | t }}
		</button>
		</div>
	</div>
</template>

<script>
import { CHECKOUT } from "../../core/objects";
export default {
	props: {
		cart: {
			type: Object,
			required: true
		},
		isMiniCart: {
			type: Boolean,
			default: false
		}
	},
	data: () =>({
		checkoutUrl: CHECKOUT
	}),
	methods: {
		closeMiniCart() {
			this.$emit('closeCart')
		}
	}

};
</script>
