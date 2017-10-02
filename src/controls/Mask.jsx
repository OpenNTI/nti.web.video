import React from 'react';
import PropTypes from 'prop-types';
import {Loading} from 'nti-web-commons';

VideoControlsMask.propTypes = {
	poster: PropTypes.string,
	buffering: PropTypes.bool,
	interacted: PropTypes.bool
};
export default function VideoControlsMask ({poster, buffering, interacted }) {
	const style = poster ? {backgroundImage: `url(${poster})`} : {backgroundColor: 'transparent'};

	return (
		<div className="video-controls-mask" style={style}>
			{!interacted && (<span className="play-button" />)}
			{buffering && interacted && (<span className="buffer"><Loading.Spinner white size="50px" /></span>)}
		</div>
	);
}
