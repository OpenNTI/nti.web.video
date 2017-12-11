export const EventHandlers = {
	playing: 'onPlaying',
	ratechange: 'onRateChange',
	pause: 'onPause',
	ended: 'onEnded',
	seeked: 'onSeeked',
	timeupdate: 'onTimeUpdate',
	ready: 'onReady'
};

export const UNSTARTED = -1;
export const ENDED = 0;
export const PLAYING = 1;
export const PAUSED = 2;
export const BUFFERING = 3;
export const CUED = 5;
