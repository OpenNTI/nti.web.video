import React from 'react';
import PropTypes from 'prop-types';

import { wait } from '@nti/lib-commons';
import { Hooks, Text, Icons } from '@nti/web-commons';
import { scoped } from '@nti/lib-locale';

import { usePlayer, useDuration, useCurrentTime } from '../Context';
import { ENDED } from '../Constants';

import { SeekTo } from './SeekTo';

const { useResolver } = Hooks;
const { isPending, isErrored } = useResolver;

const t = scoped('nti-video.controls.Resume', {
	resume: 'Resume',
	restart: 'Restart',
});

const Labels = Text.Translator(t);

const ResumeButton = styled(SeekTo)`
	transition: all 0.5s;
	max-width: var(--button-width);
	opacity: 1;
	white-space: nowrap;
	overflow: hidden;

	&.hidden {
		position: fixed;
		visibility: hidden;
		opacity: 0;
	}

	&.collapsed {
		opacity: 0;
		max-width: 0;
		padding: 0;
		margin: 0;
	}
`;

const reachedVideoEnd = (duration, resumeTime) => {
	/*
		End margin: for very long videos, the video does not register its end
					unless you watch the very last seconds of it. A margin allows the user to click on or near
					the end of the video player's slider and register that the user reached the end. The margin is
					the larger of 1s and 2% of the length of the video (in seconds).
	*/
	const endMargin = Math.max(duration * 0.02, 1);

	// If resume time is 0s, it could mean that the video has ended the last time the user watched it.
	// Set ended to true to collapse the Resume button, just in case.
	return duration - (resumeTime ?? 0) <= endMargin;
};

function useResumeTime(time) {
	const player = usePlayer();
	const duration = useDuration();
	const currentTime = useCurrentTime();

	const resumeInfoResolver = useResolver(async () => {
		const video = player?.video;

		if (!video?.fetchLink) {
			return null;
		}

		const delay = wait.min(wait.SHORT);
		const info = await video.fetchLink('resume_info');

		await delay();

		return info;
	}, [player?.video]);

	if (isPending(resumeInfoResolver)) {
		return { loading: true };
	}
	if (isErrored(resumeInfoResolver)) {
		return { loading: false, error: resumeInfoResolver };
	}

	const resumeInfo = resumeInfoResolver;
	let resumeTime = resumeInfo.ResumeSeconds ?? null; //we need it to be null not undefined if its not set

	const video = player?.video;

	/*
		Some definitions:
		End: the video player's slider is at the far right end or very close to it.
		Completed: at least 95% of the video was watched.
	*/
	const completed = video?.isCompletable() && video?.hasCompleted();
	const ended = reachedVideoEnd(duration, resumeTime);

	const restart =
		player?.getPlayerState()?.state === ENDED ||
		currentTime >= duration - 2 ||
		(!completed && ended);

	if ((completed && ended) || currentTime >= resumeTime) {
		resumeTime = null;
	}

	if (restart) {
		resumeTime = 0;
	}

	return {
		loading: false,
		resumeTime,
		restart,
	};
}

export function Resume({ time, ...otherProps }) {
	const [clicked, setClicked] = React.useState(false);
	const onClick = React.useCallback(() => setClicked(true), [setClicked]);

	const [width, setWidth] = React.useState(null);

	const buttonRef = React.useRef();
	React.useLayoutEffect(() => {
		const node = buttonRef.current?.getDOMNode?.() ?? buttonRef.current;
		const maxWidth = node?.clientWidth ? node.clientWidth + 10 : null;

		if (width !== maxWidth) {
			setWidth(maxWidth);
		}
	}, []);

	const { loading, error, resumeTime, restart } = useResumeTime(time);

	React.useEffect(() => {
		if (clicked && restart) {
			setClicked(false);
		}
	}, [restart]);

	const hidden = width === null;
	const collapsed =
		!hidden && (clicked || loading || error || resumeTime === null);

	return (
		<ResumeButton
			{...otherProps}
			ref={buttonRef}
			time={restart ? 0 : resumeTime}
			onClick={onClick}
			style={width ? { '--button-width': `${width}px` } : null}
			hidden={hidden}
			collapsed={collapsed}
			data-testid="resume-video"
		>
			<Icons.VideoResume />
			<Labels localeKey={restart ? 'restart' : 'resume'} />
		</ResumeButton>
	);
}

Resume.propTypes = {
	time: PropTypes.number,
};
