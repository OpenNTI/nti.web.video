export default function parseEmbedCode (input) {
	const div = document.createElement('div');

	div.innerHTML = input;

	const iframe = div.querySelector('iframe');

	return iframe && iframe.src;
}
