import React from 'react';
import PropTypes from 'prop-types';

import {getFormattedTimeRemaining} from '../utils';

VideoTimeRemaining.propTypes = {
	videoState: PropTypes.object
};
export default function VideoTimeRemaining ({videoState}) {
	return (
		<div className="video-time-remaining">
			<span className="remaining">{getFormattedTimeRemaining(videoState)}</span>
		</div>
	);
}
