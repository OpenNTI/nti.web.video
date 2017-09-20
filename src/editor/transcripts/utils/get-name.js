export default function getName (transcript) {
	const parts = transcript.src.split('/');

	return decodeURIComponent(parts[parts.length - 1]);
}
