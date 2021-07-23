import { usePlayer, useDuration, useCurrentTime } from '../Context';

/**
 * Returns whether the current video has been completed.
 *
 * @returns {{watchedTilEnd: boolean, videoCompletable: boolean, videoCompleted: boolean}}
 */
export default function useVideoCompletion() {
	const duration = useDuration();
	const player = usePlayer();
	const time = useCurrentTime();
	const video = player?.video;

	if (!duration) {
		return {
			videoCompletable: false,
		};
	}

	return {
		watchedTilEnd: time >= duration * 0.875, // Simplify calculation: 7/8 = 0.875
		videoCompletable: video?.isCompletable(),
		videoCompleted: video?.hasCompleted() && video?.completedSuccessfully(),
	};
}
