import React from 'react';
import PropTypes from 'prop-types';

import { scoped } from '@nti/lib-locale';
import { Text, Icons } from '@nti/web-commons';

import useResumeTime from './useResumeTime';
import ResumeButton from './ButtonCmp';

const t = scoped('nti-video.controls.Resume', {
	resume: 'Resume',
	restart: 'Restart',
});

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

	const {
		loading,
		error,
		resumeTime,
		restart
	} = useResumeTime(time);


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
			data-testid="resume-video"
		>
			<Icons.VideoResume />
			<Labels localeKey={restart ? "restart" : "resume"} />
		</ResumeButton>
	);
}

Resume.propTypes = {
	time: PropTypes.number,
};
