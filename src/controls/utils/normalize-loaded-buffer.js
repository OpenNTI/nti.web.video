/**
 * Take a TimeRange and turn it into an array
 * of loaded and length. That looks like:
 *
 * [
 * 	{
 * 		loaded: Boolean,//If this range has loaded yet
 * 		length: Number,//The length of the range
 * 		percentage: Number//The percentage of the total length (use it as the width)
 * 	}
 * ]
 *
 * @param  {Object} videoState The state of the video
 * @param {TimeRange} videoState.buffered the loaded ranges
 * @param {Number} videoState.duration the length of the video
 * @return {Array}        An array covering all the loaded and unloaded ranges
 */
export default function (videoState) {
	const {buffered, duration} = videoState || {};

	if (!buffered) { return []; }

	let ranges = [];
	let prev = 0;

	for (let i = 0; i < buffered.length; i++) {
		let start = buffered.start(i);
		let end = buffered.end(i);
		let length = end - start;
		let percentage = (length / duration) * 100;

		if (start > prev) {
			ranges.push({
				loaded: false,
				length: start - prev,
				percentage: ((start - prev) / duration) * 100
			});
		}

		ranges.push({
			loaded: true,
			length,
			percentage
		});

		prev = end;
	}

	return ranges;
}
