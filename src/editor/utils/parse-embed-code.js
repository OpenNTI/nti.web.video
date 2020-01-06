const WistiaRegex = {
	async: {
		external: /wistia\.com\/assets\/external/,
		id: /embed\/medias\/([^./]*)\.jsonp/
	},
	media: {
		url: /wistia\.com\/medias/,
		id: /wistia\.com\/medias\/([^.?/]*)/
	},
	iframeEmbed: {
		url: /wistia\.net\/embed\/iframe/,
		id: /wistia\.net\/embed\/iframe\/.([^.?/]*)/
	}
};

const normalizeWistia = (id) => `https://fast.wistia.com/embed/iframe/${id}`;

const CustomParsers = [
	//wistia async embed
	(input) => {
		if (!WistiaRegex.async.external.test(input)) { return null; }

		const matches = input.match(WistiaRegex.async.id);
		const id = matches[1];

		if (!id) { return null; }

		return normalizeWistia(id);
	},
	//wistia media url
	(input) => {
		if (!WistiaRegex.media.url.test(input)) { return null; }

		const matches = input.match(WistiaRegex.media.id);
		const id = matches[1];

		if (!id) { return null; }

		return normalizeWistia(id);
	},
	//wistia iframe url
	(input) => {
		if (!WistiaRegex.iframeEmbed.url.test(input)) { return null; }

		const matches = input.match(WistiaRegex.iframeEmbed.id);
		const id = matches[1];

		if (!id) { return null; }

		return normalizeWistia(id);
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
