import {useEffect, useState} from 'react';

import { usePlayer, useDuration } from '../../../Context';

import useResumeTime from './useResumeTime';
import { reachedVideoEnd } from './utils';

export default function useVideoCompletion() {
	const player = usePlayer();
	const duration = useDuration();
	const {resumeTime} = useResumeTime();

	const [completeAndEnded, setCompleteAndEnded] = useState(false);
	const [incompleteAndEnded, setIncompleteAndEnded] = useState(false);

	useEffect(() => {
		const isVideoCompletedAndEnded = () => {
			if (!player || duration === null || resumeTime === null) {
				return;
			}
			const video = player?.video;

			/* Some definitions:
				End: the video player's slider is at the far right end or very close to it.
					End margin: for very long videos, the video does not register its end
						unless you watch the very last seconds of it. A margin allows the user to click on or near
						the end of the video player's slider and register that the user reached the end. The margin is
						the larger of 1 and 2% of the length of the video (in seconds).

				Completed: at least 95% of the video was watched.
			*/
			const completed = video.CompletedItem;
			let ended = reachedVideoEnd(duration, resumeTime);

			// If resume time is 0s, it could mean that the video has ended the last time the user watched it.
			// Set ended to true to collapse the Resume button, just in case.
			if (resumeTime === 0) {
				ended = true;
			}

			setCompleteAndEnded(completed && ended);
			setIncompleteAndEnded(!completed && ended);
		}

		isVideoCompletedAndEnded();
	}, [player, resumeTime, duration]);

	return [completeAndEnded, incompleteAndEnded];
}
