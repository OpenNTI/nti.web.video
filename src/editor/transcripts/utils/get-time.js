const region = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	second: '2-digit',
	hour12: true,
});

function withOrdinal(n) {
	n = typeof n === 'string' ? parseInt(n, 10) : n;
	const s = ['th', 'st', 'nd', 'rd'],
		v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function getTime(time) {
	const date = new Date(time * 1000);

	const {
		day,
		dayPeriod,
		hour,
		minute,
		month,
		second,
		year,
	} = region
		.formatToParts(date)
		.reduce((o, { type, value }) => ({ ...o, [type]: value }), {});

	// return moment(date).format('MMMM Do YYYY, h:mm:ss a');
	return `${month} ${withOrdinal(
		day
	)} ${year}, ${hour}:${minute}:${second} ${dayPeriod.toLowerCase()}`;
}
