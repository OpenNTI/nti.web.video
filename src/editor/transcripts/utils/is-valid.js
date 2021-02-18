export default function isValid(transcripts) {
	if (!transcripts) {
		return false;
	}

	let seen = new Set();

	for (let transcript of transcripts) {
		let combo = transcript.lang + '_' + transcript.purpose;

		if (seen.has(combo)) {
			return false;
		}

		seen.add(combo);
	}

	return true;
}
