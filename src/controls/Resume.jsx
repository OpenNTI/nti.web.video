import React from 'react';
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

	const { loading, error, resumeTime } = useResumeTime(time);

	const hidden = width === null;
	const collapsed =
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
		>
			<Icons.VideoResume />
			<Labels localeKey="label" />
		</ResumeButton>
	);
}

Resume.propTypes = {
	time: PropTypes.number,
};
