import moment from 'moment';

export function isTranscriptEditable (transcript) {
	let isEditable = false;

	if(transcript && transcript.Links) {
		transcript.Links.forEach((l) => {
			if(l.rel === 'edit') {
				isEditable = true;
			}
		});
	}

	return isEditable;
}

export function getTime (time) {
	let date = new Date(time * 1000);
	return moment(date).format('MMMM Do YYYY, h:mm:ss a');
}

export function getTranscriptName (transcript) {
	const transcriptParts = transcript.src.split('/');

	return decodeURIComponent(transcriptParts[transcriptParts.length - 1]);
}

export function areTranscriptsValid (transcripts) {
	if(!transcripts) {
		return false;
	}

	let valid = true,
		langPurposeCombinations = new Set();

	transcripts.forEach((trn) => {
		const combo = trn.lang + '_' + trn.purpose;

		if(langPurposeCombinations.has(combo)) {
			valid = false;
		}
		else {
			langPurposeCombinations.add(combo);
		}
	});

	return valid;
}
