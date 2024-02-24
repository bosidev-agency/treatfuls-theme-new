export default {
	computed: {
		section() {
			return ["id", "type", "settings", "blocks"].reduce((data, key) => {
				const value = this.$root[key];

				return {
					...data,
					[key]: value
				};
			}, {});
		}
	}
};
