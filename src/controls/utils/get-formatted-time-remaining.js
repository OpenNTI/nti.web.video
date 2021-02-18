import formatTime from './format-time';

export default function getTimeRemaining(videoState) {
	const { duration, currentTime } = videoState || {};
	const remaining = (duration || 0) - (currentTime || 0); //Time remaining in seconds (because media api)

	return formatTime(remaining);
}
