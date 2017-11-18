let video = null;

function canPlay (type) {
	video = video || (document && document.createElement && document.createElement('video'));

	return !type || !video || !video.canPlayType || video.canPlayType(type);
}

export default function canPlayType (type) {
	if (!Array.isArray(type)) {
		type = [type];
	}

	for (let t of type) {
		if (canPlay(t)) {
			return true;
		}
	}

	return false;
}
