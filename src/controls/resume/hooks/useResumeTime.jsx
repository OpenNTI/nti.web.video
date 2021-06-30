import { wait } from '@nti/lib-commons';
import { Hooks } from '@nti/web-commons';

import { usePlayer, useDuration } from '../../../Context';

import { reachedVideoEnd } from './utils';

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

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

		return info.ResumeSeconds ?? null;
	}, [player, time]);

	return {
		loading: isPending(resolver),
		error: isErrored(resolver) ? resolver : null,
		resumeTime: isResolved(resolver) ? (reachedVideoEnd(duration, resolver) ? 0 : resolver) : null,
	};
};
