import React from 'react';

import SeekTo from '../SeekTo';
import { VideoContext } from '../../Context';
import {YoutubeSrc, Player} from '../../__stories__/VideoSources';

export default {
	title: 'Controls/SeekTo',
	component: SeekTo,
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

export const Base = (props) => (
	<VideoContext>
		<Player src={YoutubeSrc} {...props} />
		<SeekTo time={10}>10 Seconds</SeekTo>, <SeekTo time={20}>20 Seconds</SeekTo>, <SeekTo time={30}>30 Seconds</SeekTo>
	</VideoContext>
);
