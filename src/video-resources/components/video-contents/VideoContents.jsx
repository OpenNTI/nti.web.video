import React from 'react';
import PropTypes from 'prop-types';

import Video from './Video.jsx';


const VideoContents = ({ videos, selected = false, onSelectChange }) => (
	<div className="video-contents">
		{videos.length > 0 && videos.map(video => (
			<Video
				key={video.getID()}
				isSelected={selected && selected.getID() === video.getID()}
				onSelectChange={onSelectChange}
				video={video}
			/>
		))}
		{videos.length === 0 && (
			<div className="empty-contents">
				There are no videos to show.
			</div>
		)}
	</div>
);

VideoContents.propTypes = {
	selected: PropTypes.shape({
		getID: PropTypes.func.isRequired,
	}),
	videos: PropTypes.array.isRequired,
	onSelectChange: PropTypes.func.isRequired,
};

export default VideoContents;