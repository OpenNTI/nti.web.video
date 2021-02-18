export default function canEdit(transcript) {
	const links = (transcript && transcript.Links) || [];

	for (let link of links) {
		if (link.rel === 'edit') {
			return true;
		}
	}

	return false;
}
