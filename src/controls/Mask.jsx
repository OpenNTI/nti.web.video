import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';
import {Loading} from 'nti-web-commons';

const DEFAULT_TEXT = {
	unableToPlay: 'Unable to play video'
};

const t = scoped('nti-video.controls.mask', DEFAULT_TEXT);

VideoControlsMask.propTypes = {
	poster: PropTypes.string,
	buffering: PropTypes.bool,
	interacted: PropTypes.bool,
	ended: PropTypes.bool,
	hasSources: PropTypes.bool
};
export default function VideoControlsMask ({poster, buffering, interacted, hasSources, ended }) {
	const cls = cx('video-controls-mask', {'no-sources': !hasSources});
	const style = {};

	if (poster && hasSources && !interacted) {
		style.backgroundImage = `url(${poster})`;
	} else if (hasSources) {
		style.backgroundColor = 'transparent';
	}

	return (
		<div className={cls} style={style}>
			{!hasSources && (<span className="unable-to-play">{t('unableToPlay')}</span>)}
			{(!interacted || ended) && hasSources && (<span className="play-button" />)}
			{buffering && interacted && hasSources && (<span className="buffer"><Loading.Spinner white size="50px" /></span>)}
		</div>
	);
}
