import React from 'react';
import PropTypes from 'prop-types';


VideoControlsMask.propTypes = {
	poster: PropTypes.string,
};
export default function VideoControlsMask ({poster}) {
	const style = poster ? {backgroundImage: `url(${poster})`} : {backgroundColor: 'transparent'};

	return (
		<div className="video-controls-mask" style={style}>
			<span className="play-button" />
		</div>
	);
}
