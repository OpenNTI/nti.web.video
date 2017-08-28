import React from 'react';
import PropTypes from 'prop-types';
import {Loading} from 'nti-web-commons';


VideoControlsMask.propTypes = {
	poster: PropTypes.string,
	buffering: PropTypes.bool
};
export default function VideoControlsMask ({poster, buffering}) {
	const style = poster ? {backgroundImage: `url(${poster})`} : {backgroundColor: 'transparent'};

	return (
		<div className="video-controls-mask" style={style}>
			{!buffering && (<span className="play-button" />)}
			{buffering && (<span className="buffer"><Loading.Spinner white size="50px" /></span>)}
		</div>
	);
}
