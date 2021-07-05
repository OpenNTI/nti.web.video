import { wait } from '@nti/lib-commons';
import { Hooks } from '@nti/web-commons';

import { usePlayer, useDuration } from '../../Context';

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

const reachedVideoEnd = (duration, resumeTime) => {
	/*
		End margin: for very long videos, the video does not register its end
					unless you watch the very last seconds of it. A margin allows the user to click on or near
					the end of the video player's slider and register that the user reached the end. The margin is
					the larger of 1 and 2% of the length of the video (in seconds).
	*/
	const endMargin = duration * 0.02 <= 1 ? 1 : duration * 0.05;

	// If resume time is 0s, it could mean that the video has ended the last time the user watched it.
		// Set ended to true to collapse the Resume button, just in case.
	return (duration - (resumeTime ?? 0)) <= endMargin;
};

export default function useResumeTime (time) {
	const player = usePlayer();
	const duration = useDuration();

	const resolver = useResolver(async () => {
		if (time) {
			return time;
		}

		const video = player?.video;

		if (!video?.fetchLink) {
			return null;
		}

		const delay = wait.min(wait.SHORT);
		const info = await video.fetchLink('resume_info');

		await delay();

		/* Some definitions:
			End: the video player's slider is at the far right end or very close to it.
			Completed: at least 95% of the video was watched.
		*/

		let resumeTime = info.ResumeSeconds;

		const completed = video.isCompletable() && video.hasCompleted();
		const ended = reachedVideoEnd(duration, resumeTime);
		const restart = !completed && ended;

		// No need to resume if the video ended and has been completed or the player is already at the resume location.
		// Else if we need to restart the video, set resume time to 0s.
		if (completed && ended || resumeTime === time) {
			resumeTime = null;
		} else if (restart) {
			resumeTime = 0;
		}

		return {resumeTime, restart};
	}, [player, time, duration]);

	return {
		loading: isPending(resolver),
		error: isErrored(resolver) ? resolver : null,
		resumeTime: isResolved(resolver) ? resolver.resumeTime : null,
		restart: resolver?.restart,
	};
};
