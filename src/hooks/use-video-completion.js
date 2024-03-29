import { useEffect, useState } from 'react';

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

	const watchedTilEnd =
		time >= duration * 0.95 || player?.getPlayerState()?.state === ENDED;
	const videoCompletable = video?.isCompletable();
	const videoCompleted =
		video?.hasCompleted() && video?.completedSuccessfully();

	useEffect(() => {
		video?.refresh();
	}, [video]);

	/**
	 * Meaning of !(videoCompletable && videoCompleted):
	 * Is to refresh video only when we are not sure if it is completed or not.
	 * That is: We can't un-complete a video so we don't need to refresh it if we already know it's been completed.
	 */
	const hasEnded = watchedTilEnd && !(videoCompletable && videoCompleted);

	const [receivedBatchEventAfterEnd, setReceivedBatchEventAfterEnd] =
		useState(false);

	/**
	 * What's going on here:
	 * We are adding a listener to execute after the watched segments batch events is sent to the server.
	 * The listener is basically checking if the user is at the "end" of the video. If so, then we set
	 * the receivedBatchEventAfterEnd state to true, which basically refreshes the video. Otherwise,
	 * if the video has not ended and we have receivedBatchEventAfterEnd, then we will have to update
	 * the state such that we can refresh the video when receivedBatchEventAfterEnd toggles back to true.
	 */
	useEffect(() => {
		const listener = () => {
			if (hasEnded) {
				setReceivedBatchEventAfterEnd(true);
			} else if (!hasEnded && receivedBatchEventAfterEnd) {
				setReceivedBatchEventAfterEnd(false);
			}
		};

		AnalyticsHooks.addAfterBatchEventsListener(listener);

		return () => AnalyticsHooks.removeAfterBatchEventsListener(listener);
	}, [hasEnded]);

	const updating = useResolver(async () => {
		if (receivedBatchEventAfterEnd) {
			await video.refresh();
		}
	}, [receivedBatchEventAfterEnd]);

	return {
		watchedTilEnd,
		videoCompletable,
		videoCompleted: useResolver.isResolved(updating)
			? video?.hasCompleted() && video?.completedSuccessfully()
			: false,
		loading: useResolver.isPending(updating) || !receivedBatchEventAfterEnd,
	};
}
