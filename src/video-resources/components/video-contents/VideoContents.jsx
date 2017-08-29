import React from 'react';
import PropTypes from 'prop-types';

import Video from './Video.jsx';


const VideoContents = ({ videos, selection = '', selected = '', onSelectChange, onSelectionChange }) => {
	return (
		<div className="video-contents">
			{videos.map(video => (
				<Video
					key={video.getID()}
					isSelected={selected === video.getID()}
					isSelection={selection === video.getID()}
					onSelectChange={onSelectChange}
					onSelectionChange={onSelectionChange}
					video={video}
				/>
			))}
		</div>
	);
};

VideoContents.propTypes = {
	selection: PropTypes.string,
	selected: PropTypes.string,
	videos: PropTypes.array.isRequired,
	onSelectChange: PropTypes.func.isRequired,
	onSelectionChange: PropTypes.func.isRequired,
};

export default VideoContents;
