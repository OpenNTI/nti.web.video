import { useResolver } from '@nti/web-commons';

import { usePlayer, useDuration } from '../Context';

/**
 * Returns whether the current video has been completed.
 *
 * @param {Array} segments
 * @returns {boolean}
 */
export default function useVideoCompletion(segments) {
	const duration = useDuration();
	const player = usePlayer();
	const video = player?.video;

	const percentCompleted =
		(100 *
			segments?.reduce(
				(acc, segment) =>
					acc + (segment['data-end'] - segment['data-start']),
				0
			)) /
		duration;

	const bin = percentCompleted - (percentCompleted % 5);

	const resolver = useResolver(async () => {
		if (!video) {
			return;
		}

		await video?.refresh();

		return video.isCompletable() && video.hasCompleted();
	}, [player, duration, bin]);

	return useResolver.isResolved(resolver) ? resolver : null;
}
