import React from 'react';

import Video from '../Video';

import {YoutubeSrc, VimeoSrc, KalturaSrc, Player} from './VideoSources';


export default {
	title: 'Player',
	component: Video,
	argTypes: {
		onTimeUpdate: { action: 'timeupdate' },
		onSeeked: { action: 'seeked' },
		onPlaying: { action: 'playing' },
		onPause: { action: 'paused' },
		onEnded: { action: 'ended' },
		onError: { action: 'error' },
		onReady: { action: 'ready' }
	}
};

export const Youtube = (props) => (<Player src={YoutubeSrc} {...props} />);
export const Vimeo = (props) => (<Player src={VimeoSrc} {...props} />);
export const Kaltura = (props) => (<Player src={KalturaSrc} {...props} />);
