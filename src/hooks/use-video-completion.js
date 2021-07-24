import { useResolver } from '@nti/web-commons';

import { ENDED } from '../Constants';
import { usePlayer, useDuration, useCurrentTime } from '../Context';

/**
 * Returns whether the current video has been completed and watched until the end.
 * The idea: if the current video time is in the last 5% of the video, then we will consider
 * that to be the end of the video. If that's the case then we will show alert if the user has not completed at least 95%
 * the video.
 * As far as completion goes, we use two values: hasCompleted() and completedSuccessfully().
 *
 * @returns {{watchedTilEnd: boolean, videoCompletable: boolean, videoCompleted: boolean}}
 */
export default function useVideoCompletion() {
	const duration = useDuration();
	const player = usePlayer();
	const time = useCurrentTime();
	const video = player?.video;

	const videoActuallyEnded = player?.getPlayerState()?.state === ENDED;

	const watchedTilEnd =
		time >= duration * 0.95 || player?.getPlayerState()?.state === ENDED;

	const resolver = useResolver(async () => {
		if (watchedTilEnd) {
			await video?.refresh();
		}
		return {
			watchedTilEnd,
			videoCompletable: video?.isCompletable(),
			videoCompleted:
				video?.hasCompleted() && video?.completedSuccessfully(),
		};
	}, [watchedTilEnd, videoActuallyEnded]);

	return useResolver.isResolved(resolver) ? resolver : false;
}
