const WistiaExternalsRegex = /wistia\.com\/assets\/external/;
const WistiaIdRegex = /embed\/medias\/([^./]*)\.jsonp/;

const CustomParsers = [
	//wistia async embed
	(input) => {
		if (!WistiaExternalsRegex.test(input)) { return null; }

		const matches = input.match(WistiaIdRegex);
		const id = matches[1];

		if (!id) { return null; }

		return `https://fast.wistia.com/embed/iframe/${id}`;
	}
];

export default function parseEmbedCode (input) {
	for (let custom of CustomParsers) {
		const parsed = custom(input);

		if (parsed) { return parsed; }
	}

	const div = document.createElement('div');

	div.innerHTML = input;

	const iframe = div.querySelector('iframe');

	return iframe && iframe.src;
}
