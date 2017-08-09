import formatTime from './format-time';

export default function getFormattedCurrentTime (videoState) {
	const {currentTime} = videoState || {};

	return formatTime(currentTime || 0);
}
