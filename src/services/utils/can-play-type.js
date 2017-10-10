let video = null;

export default function canPlayType (type) {
	video = video || (document && document.createElement && document.createElement('video'));

	return !type || !video || !video.canPlayType || video.canPlayType(type);
}
