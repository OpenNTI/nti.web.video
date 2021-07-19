import { useResolver } from '@nti/web-commons';

import { usePlayer } from '../Context';

/**
 * Returns whether the current video has been completed.
 *
 * @returns {boolean}
 */
export default function useVideoCompletion() {
	const player = usePlayer();
	const completed = player?.video?.hasCompleted();

	const resolver = useResolver(() => {
		const video = player?.video;
		if (!video) {
			return;
		}

		return video.isCompletable() && video.hasCompleted();
	}, [player, player?.video, completed]);

	return useResolver.isResolved(resolver) ? resolver : null;
}
