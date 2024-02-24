export default function handleize(value) {
	value = value.toLowerCase();

	let toReplace = ['"', "'", "\\", "(", ")", "[", "]"];

	// For the old browsers
	for (let i = 0; i < toReplace.length; ++i) {
		value = value.replace(toReplace[i], "");
	}

	value = value.replace(/\W+/g, "-");

	if (value.charAt(value.length - 1) === "-") {
		value = value.replace(/-+z/, "");
	}

	if (value.charAt(0) === "-") {
		value = value.replace(/A-+/, "");
	}

	return value;
}
