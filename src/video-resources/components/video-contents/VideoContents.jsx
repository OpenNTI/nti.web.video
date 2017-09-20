import React from 'react';
import PropTypes from 'prop-types';
import {Loading} from 'nti-web-commons';

import Video from './Video';


const VideoContents = ({ videos, selected = false, onSelectChange }) => (
	<div className="video-resources-video-contents">
		{!videos && (
			<Loading.Mask />
		)}
		{videos && videos.length > 0 && videos.map(video => (
			<Video
				key={video.getID()}
				isSelected={selected && selected.getID() === video.getID()}
				onSelectChange={onSelectChange}
				video={video}
			/>
		))}
		{videos && videos.length === 0 && (
			<div className="empty-contents">
				There are no videos to show currently.
			</div>
		)}
	</div>
);

VideoContents.propTypes = {
	selected: PropTypes.shape({
		getID: PropTypes.func.isRequired,
	}),
	videos: PropTypes.array,
	onSelectChange: PropTypes.func.isRequired,
};

export default VideoContents;
