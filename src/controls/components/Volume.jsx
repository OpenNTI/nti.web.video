import React from 'react';

import MuteUnmute from './MuteUnmute';
import VolumeSlider from './VolumeSlider';


export default function VideoVolumeControl (props) {
	return (
		<div className="video-volume-control">
			<MuteUnmute {...props} />
			<VolumeSlider {...props} />
		</div>
	);
}
