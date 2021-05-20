/** @typedef {number} VideoTime - video time in seconds */
/** @typedef {number} Count - number of views */
/** @typedef {{video_start_time: VideoTime, video_end_time: VideoTime, count: Count}} Segment */

const StartKey = 'video_start_time';
const EndKey = 'video_end_time';
const CountKey = 'count';

const start = s => s[StartKey];
const end = s => s[EndKey];
const count = s => s[CountKey];

const last = arr => arr[arr.length - 1];

const Intersections = [
	//No overlap with existing segments
	{
		check: (segments, next) => !last(segments) || end(last(segments)) < start(next),
		insert: (segments, next) => ([...segments, {...next}])
	},
	//Exact same segment
	{
		check: (segments, next) => start(last(segments)) === start(next) && end(last(segments)) === end(next),
		insert: (segments, next) => ([
			...(segments.slice(0, -1)),
			{...last(segments), count: count(last(segments)) + count(next)}
		])
	},
	//Same start, different end times
	{
		check: (segments, next) => start(last(segments)) === start(next),
		insert: (segments, next) => {
			const prev = last(segments);

			return [
				...(segments.slice(0, -1)),
				{
					[StartKey]: start(prev),
					[EndKey]: end(next),
					[CountKey]: count(prev) + count(next)
				},
				{
					[StartKey]: end(next) + 1,
					[EndKey]: end(prev),
					[CountKey]: count(prev)
				}
			];
		}
	},
	//Different start, same end times
	{
		check: (segments, next) => end(last(segments)) === end(next),
		insert: (segments, next) => {
			const prev = last(segments);

			return [
				...(segments.slice(0, -1)),
				{
					[StartKey]: start(prev),
					[EndKey]: start(next) - 1,
					[CountKey]: count(prev)
				},
				{
					[StartKey]: start(next),
					[EndKey]: end(next),
					[CountKey]: count(prev) + count(next)
				}
			];
		}
	},
	//The next event is contained with in the previous event
	{
		check: (segments, next) => end(last(segments)) > end(next),
		insert: (segments, next) => {
			const prev = last(segments);

			return [
				...(segments.slice(0, -1)),
				{
					[StartKey]: start(prev),
					[EndKey]: start(next) - 1,
					[CountKey]: count(prev)
				},
				{
					[StartKey]: start(next),
					[EndKey]: end(next),
					[CountKey]: count(prev) + count(next)
				},
				{
					[StartKey]: end(next) + 1,
					[EndKey]: end(prev),
					[CountKey]: count(prev)
				}
			];
		}
	},
	//The next event starts within the previous, but ends after
	{
		check: (segments, next) => end(last(segments)) < end(next),
		insert: (segments, next) => {
			const prev = last(segments);

			return [
				...(segments.slice(0, -1)),
				{
					[StartKey]: start(prev),
					[EndKey]: start(next) - 1,
					[CountKey]: count(prev)
				},
				{
					[StartKey]: start(next),
					[EndKey]: end(prev),
					[CountKey]: count(prev) + count(next)
				},
				{
					[StartKey]: end(prev) + 1,
					[EndKey]: end(next),
					[CountKey]: count(next)
				}
			];
		}
	}

];

function insertSegment (segments = [], segment) {
	const intersection = Intersections.find(i => i.check(segments, segment));

	return intersection.insert(segments, {...segment});
}

/**
 * Group a list of watched segments into a their unique bins and count how many events
 * cover a given range
 *
 * @param {[Segment]} segments
 * @returns {[Segment]}
 */
export default function groupWatchedSegments (segments) {
	return segments
		.sort((a, b) => start(a) - start(b))
		.reduce(insertSegment, []);
}
