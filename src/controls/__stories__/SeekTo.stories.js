import React from 'react';

import SeekTo from '../SeekTo';
import { VideoContext } from '../../Context';
import { YouTubeSrc, Player, argTypes } from '../../__stories__/VideoSources';

export default {
	title: 'Controls/SeekTo',
	component: SeekTo
};

export const Base = (props) => (
	<VideoContext>
		<Player src={YouTubeSrc} {...props} />
		<SeekTo time={10}>10 Seconds</SeekTo>, <SeekTo time={20}>20 Seconds</SeekTo>, <SeekTo time={30}>30 Seconds</SeekTo>
	</VideoContext>
);

Base.argTypes = argTypes;
