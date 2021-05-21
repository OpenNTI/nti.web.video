/** @typedef {number} VideoTime - video time in seconds */
/** @typedef {number} Count - number of views */
/** @typedef {{video_start_time: VideoTime, video_end_time: VideoTime, count: Count}} Segment */

const StartKey = 'video_start_time';
const EndKey = 'video_end_time';

const start = s => s[StartKey];
const end = s => s[EndKey];

const last = arr => arr[arr.length - 1];

/**
 * Group a list of watched segments into a their unique bins and count how many events
 * cover a given range
 *
 * @param {[Segment]} segments
 * @returns {[Segment]}
 */
export default function groupAdjoiningSegments(segments) {
	debugger;
	return segments
		.sort((a, b) =>
			start(a) === start(b) ? end(a) - end(b) : start(a) - start(b)
		)
		.reduce((acc, segment) => {
			const prev = last(acc);

			if (!prev || start(segment) > end(prev) + 1) {
				return [...acc, segment];
			}

			return [
				...acc.slice(0, -1),
				{ [StartKey]: start(prev), [EndKey]: end(segment) },
			];
		}, []);
}
