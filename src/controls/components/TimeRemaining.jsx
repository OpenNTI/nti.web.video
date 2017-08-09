import React from 'react';
import PropTypes from 'prop-types';

import {getFormattedTimeRemaining} from '../utils';

VideoTimeRemaining.propTypes = {
	videoState: PropTypes.object,
	isTouch: PropTypes.bool
};
export default function VideoTimeRemaining ({videoState, isTouch}) {
	return (
		<div className="video-time-remaining">
			<span className="remaining">{getFormattedTimeRemaining(videoState)}</span>
		</div>
	);
}
