import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';

import { scoped } from '@nti/lib-locale';
import { wait } from '@nti/lib-commons';
import { Hooks, Text, Icons } from '@nti/web-commons';

import { usePlayer } from '../Context';

import { SeekTo } from './SeekTo';

const t = scoped('nti-video.controls.Resume', {
	label: 'Resume',
});

const { useResolver } = Hooks;
const { isPending, isErrored, isResolved } = useResolver;

const ResumeButton = styled(SeekTo)`
	transition: max-width 0.5s, opacity 0.5s;
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

const Labels = Text.Translator(t);

const useResumeTime = time => {
	const player = usePlayer();

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
		resumeTime: isResolved(resolver) ? resolver : null,
	};
};

function useVideoCompletion () {
	const player = usePlayer();

	const [completeAndEnded, setCompleteAndEnded] = useState(false);
	const [incompleteAndEnded, setIncompleteAndEnded] = useState(false);

	useEffect(() => {
		const isVideoCompletedAndEnded = async () => {
			if (!player) {
				return;
			}

			const video = player?.video;

			if (!video?.fetchLink) {
				return null;
			}

			const info = await video.fetchLink('resume_info');
			const duration = await video.getDuration();
			const resumeSeconds = info.ResumeSeconds;

			/* Some definitions:
				End: the video player's slider is at the far right end or very close to it.
					End margin: for very long videos, the video does not register the end of the video
						unless you watch the very last seconds of it. A margin allows the user to click on or near
						the end of the video player's slider and register that the user reached the end. The margin is
						the larger of 1 and 2% of the length of the video (in seconds).

				Completed: at least 95% of the video was watched.
			*/
			const endMargin = duration * 0.02 <= 1 ? 1 : duration * 0.05
			const completed = video.CompletedItem;
			const ended = (duration - (resumeSeconds ?? 0)) <= endMargin;

			setCompleteAndEnded(completed && ended);
			setIncompleteAndEnded(!completed && ended);
		}

		isVideoCompletedAndEnded();
	}, [player]);

	return [completeAndEnded, incompleteAndEnded];
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

	let { loading, error, resumeTime } = useResumeTime(time);

	const [completeAndEnded, incompleteAndEnded] = useVideoCompletion();

	if (incompleteAndEnded) {
		resumeTime = 0;
	}

	const hidden = width === null;
	const collapsed =
		completeAndEnded ||
		incompleteAndEnded ||
		clicked || (!hidden && (loading || error || resumeTime === null));

	return (
		<ResumeButton
			{...otherProps}
			ref={buttonRef}
			time={resumeTime}
			onClick={onClick}
			style={width ? { '--button-width': `${width}px` } : null}
			hidden={hidden}
			collapsed={collapsed}
			data-testid="resume-video"
		>
			<Icons.VideoResume />
			<Labels localeKey="label" />
		</ResumeButton>
	);
}

Resume.propTypes = {
	time: PropTypes.number,
};
