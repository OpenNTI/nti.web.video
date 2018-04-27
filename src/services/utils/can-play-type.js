import HLS from 'hls.js';

import {HLS_TYPE} from './constants';

// Internet Explorer 6-11 (testing conditional execution of comment)
const isIE = /*@cc_on!@*/false || !!document.documentMode;

let video = null;

function canPlay (type) {
	video = video || (document && document.createElement && document.createElement('video'));

	return !type
		|| !video
		|| !video.canPlayType
		|| video.canPlayType(type)
		|| (type === HLS_TYPE && HLS.isSupported() && !isIE);
}

export default function canPlayType (type) {
	if (!Array.isArray(type)) {
		type = [type];
	}

	for (let t of type) {
		if (canPlay(t)) {
			return true;
		}
	}

	return false;
}
