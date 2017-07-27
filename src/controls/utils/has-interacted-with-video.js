import {UNSTARTED} from '../../Constants';

const PLAYED_THRESHOLD = 0.5;

export default function hasInteracted (videoState) {
	if (!videoState) { return false; }

	const {state, currentTime} = videoState;

	return state !== UNSTARTED && currentTime > PLAYED_THRESHOLD;
}
