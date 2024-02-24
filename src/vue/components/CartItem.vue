<template>
	<div class="cart-product" :class="{ 'cart-product--mini': isMiniCart }">
		<a :href="item.url" class="cart-product__image-wrap">
			<picture>
				<source
					:srcset="(item.image) ? item.image.src : null | img_url('170x')"
					media="(min-width: 2560px)">
				<source
					:srcset="(item.image) ? item.image.src : null | img_url('125x')"
					media="(min-width: 1920px)">
				<img
					:src="(item.image) ? item.image.src : null | img_url('85x')"
					:alt="(item.image) ? item.image.alt : item.title | default_value(item.title)"
				/>
			</picture>
		</a>

		<div class="cart-product__info">
			<div class="cart-product__heading">
				<a class="cart-product__title" :href="item.url">{{ item.title }}</a>
				<button
					type="button"
					class="cart-product__remove"
					@click="removeItem({ key: item.key })">
					<IconBin v-if="isMiniCart" />
					<IconCross v-else/>
				</button>
			</div>

			<div class="cart-product__footer">
				<div class="cart-product__quantity">
					<button class="cart-product__quantity-btn cart-product__quantity-btn--minus"
									@click="changeQuantity({ key: item.key, quantity: item.quantity - 1 })"
					></button>

					<input class="cart-product__quantity-input"
								 type="number"
								 v-model.number.lazy="item.quantity"
								 @change="changeQuantity({ key: item.key, quantity: item.quantity })"
					/>

					<button class="cart-product__quantity-btn cart-product__quantity-btn--plus"
									@click="changeQuantity({ key: item.key, quantity: item.quantity + 1 })"
					></button>
				</div>

				<div class="cart-product__amount" v-if="!isMiniCart">
					<span class="cart-product__price">{{ item.final_line_price | money }}</span>
				</div>
				<div class="cart-product__amount" v-else>
					<span
						v-if="item.variant.compare_at_price"
						class="cart-product__price cart-product__price--old"
					>
						{{ item.variant.compare_at_price | money }}
					</span>
					<span
						class="cart-product__price"
						:class="item.variant.compare_at_price ? 'cart-product__price--new': ''"
					>
						{{ item.final_price | money }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import {createNamespacedHelpers} from 'vuex';

const {mapActions} = createNamespacedHelpers("cart");
import {cartActions} from '../store/cart/types';
import IconCross from '../../../icons/icon-cross.svg';
import IconBin from '../../../icons/icon-bin.svg';

export default {
	props: {
		item: {
			type: Object,
			required: true
		},
		isMiniCart: {
			type: Boolean,
			default: false
		}
	},
	components: {
		IconCross,
		IconBin
	},
	methods: {
		...mapActions({
			initCart: cartActions.INIT_CART,
			removeItem: cartActions.REMOVE_ITEM,
			changeQuantity: cartActions.CHANGE_QUANTITY
		})
	}
};
</script>
