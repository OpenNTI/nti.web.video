import React from 'react';
import PropTypes from 'prop-types';

import { scoped } from '@nti/lib-locale';
import { Text, Icons } from '@nti/web-commons';

import { SeekTo } from '../SeekTo';

import {useVideoCompletion, useResumeTime} from './hooks';

const t = scoped('nti-video.controls.Resume', {
	label: 'Resume',
});

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

export default function Resume({ time, ...otherProps }) {
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
