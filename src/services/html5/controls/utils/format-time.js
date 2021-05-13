const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;

const MINUTES_IN_HOUR = 60;

function ensureLeading(num) {
	return num < 10 ? `0${num}` : num;
}

function format(hours, minutes, seconds) {
	const minutesFormat = ensureLeading(minutes);
	const secondsFormat = ensureLeading(seconds);

	return hours
		? `${hours}:${minutesFormat}:${secondsFormat}`
		: `${minutesFormat}:${secondsFormat}`;
}

export default function formatTime(time) {
	time = isFinite(time) ? time || 0 : 0;

	const hours = Math.floor(time / SECONDS_IN_HOUR);
	const minutes = Math.floor((time / SECONDS_IN_MINUTE) % MINUTES_IN_HOUR);
	const seconds = Math.floor(time % SECONDS_IN_MINUTE);

	return format(hours, minutes, seconds);
}
