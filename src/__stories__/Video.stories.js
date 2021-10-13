
import Video from '../Video';

import { YouTubeSrc, VimeoSrc, KalturaSrc, Player } from './VideoSources';

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

export const YouTube = (props) => (<Player src={YouTubeSrc} {...props} />);
export const Vimeo = (props) => (<Player src={VimeoSrc} {...props} />);
export const Kaltura = (props) => (<Player src={KalturaSrc} {...props} />);
