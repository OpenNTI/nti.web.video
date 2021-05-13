import { ENDED } from '../../../../Constants';

export default function isEnded(videoState) {
	const { state } = videoState || {};

	return state != null && state === ENDED;
}
