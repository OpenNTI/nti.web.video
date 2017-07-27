import {PLAYING} from '../../Constants';

export default function isPlaying (videoState) {
	const {state} = videoState || {};

	return state === PLAYING;
}
