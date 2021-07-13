import { useState, useEffect } from 'react';

import { useDuration } from '../Context';

/**
 * Returns whether a given array of watched segments suggests that the represented video was once watched
 * until the end.
 *
 * @param {Array} segments
 * @returns {boolean}
 */
export default function useWatchedTilEnd(segments) {
	const duration = useDuration();

	const [result, setResult] = useState(false);

	useEffect(() => {
		if (segments && duration) {
			setResult(
				duration - segments[segments.length - 1]?.['data-end'] <=
					Math.max(duration * 0.02, 1)
			);
		}
	}, [segments, duration]);

	return result;
}
