import React from 'react';
import PropTypes from 'prop-types';

import {scoped} from '@nti/lib-locale';
import {Hooks, Text} from '@nti/web-commons';

import {usePlayer} from '../Context';

import { SeekTo } from './SeekTo';

const t = scoped('nti-video.controls.Resume', {
	label: 'Resume'
});

const {useResolver} = Hooks;
const {isPending, isErrored, isResolved} = useResolver;

const ResumeButton = styled(SeekTo)`
	&.loading {
		display: none;
	}
`;

const Labels = Text.Translator(t);

export function Resume ({time, ...otherProps}) {
	const player = usePlayer();

	const resolver = useResolver(async () => {
		if (time) { return time; }

		const video = player?.video;

		if (!video?.fetchLink) { return null; }

		const info = await video.fetchLink('resume_info');

		return info.ResumeSeconds;
	}, [player, time]);

	const loading = isPending(resolver);
	const error = isErrored(resolver) ? resolver : null;
	const resumeTime = isResolved(resolver) ? resolver : null;

	return (
		<ResumeButton
			{...otherProps}
			time={resumeTime}
			disabled={error || loading}
			loading={loading}
			error={error}
		>
			<Labels localeKey="label" />
		</ResumeButton>
	)
}

Resume.propTypes = {
	time: PropTypes.number
};
