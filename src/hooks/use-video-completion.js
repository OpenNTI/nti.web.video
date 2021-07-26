import React from 'react';

import { Hooks as AnalyticsHooks } from '@nti/lib-analytics';
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
	const videoCompletable = video?.isCompletable();
	const videoCompleted =
		video?.hasCompleted() && video?.completedSuccessfully();

	const [bin, setBin] = React.useState();

	React.useEffect(() => {
		if (!video) {
			return;
		}
		function updateBin() {
			const time = player.getPlayerState().time;
			const newBin = time - (time % 5);

			if (newBin !== bin) {
				setBin(newBin);
			}
		}

		AnalyticsHooks.addAfterBatchEventsListener(updateBin);

		return () => AnalyticsHooks.removeAfterBatchEventsListener(updateBin);
	}, [video]);

	const resolver = useResolver(async () => {
		// Refresh video only when we are not sure if it is completed or not.
		// (We can't un-complete a video so we don't need to refresh it if we already know it's been completed.)
		if (watchedTilEnd && !(videoCompletable && videoCompleted)) {
			await video?.refresh();
		}
	}, [watchedTilEnd, videoActuallyEnded, bin]);

	return {
		watchedTilEnd,
		videoCompletable,
		videoCompleted: useResolver.isResolved(resolver)
			? video?.hasCompleted() && video?.completedSuccessfully()
			: false,
		loading: useResolver.isPending(resolver),
	};
}
