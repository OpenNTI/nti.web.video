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
export function groupAdjoiningSegments(segments) {
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
				{
					[StartKey]: start(prev),
					[EndKey]: Math.max(end(segment), end(prev)),
				},
			];
		}, []);
}

const MinVisibilityPx = 4; //consider any segment less than 4px as to narrow to be visible

function buildSegmentWatchedIndex(segments) {
	const index = segments.reduce((acc, segment) => {
		const segStart = start(segment);
		const segEnd = end(segment);

		if (!acc.has(segStart) || acc.get(segStart) < segEnd) {
			acc.set(segStart, segEnd);
		}

		return acc;
	}, new Map());

	const starts = Array.from(index.keys()).sort();

	const findClosestStart = s => {
		for (let i = 0; i < starts.length; i++) {
			const segStart = starts[i];

			if (s === segStart) {
				return starts[i];
			}

			if (s < segStart) {
				return starts[i - 1];
			}
		}

		return starts[0];
	};

	return {
		hasWatchedEntireSegment(segStart, segEnd) {
			const start = findClosestStart(segStart);

			return start != null && index.get(start) >= segEnd;
		},
	};
}

export function getVisibleSegments(segments, maxDuration, displayWidth) {
	if (!displayWidth) {
		return [];
	}

	const watchedIndex = buildSegmentWatchedIndex(segments);
	const minDuration = (MinVisibilityPx / displayWidth) * maxDuration;

	const visible = Array.from({
		length: Math.ceil(maxDuration / minDuration),
	}).reduce((acc, _, i) => {
		const start = i * minDuration;
		const end = Math.min(start + minDuration, maxDuration);

		return watchedIndex.hasWatchedEntireSegment(start, end)
			? [...acc, { [StartKey]: start, [EndKey]: end }]
			: acc;
	}, []);

	return groupAdjoiningSegments(visible);
}
