import Url from 'url';

import kaltura from './kaltura';
import vimeo from './vimeo';
import youtube from './youtube';

const kalturaRe = /^kaltura/i;
const vimeoRe = /vimeo/i;
const youtubeRe = /youtu(\.?)be/i;

const serviceMap = { youtube, vimeo, kaltura };
const PROTOCOL_LESS = /^\/\//i;
const ensureProtocol = x => PROTOCOL_LESS.test(x) ? `http:${x}` : x;

export function getUrl (data) {
	let src = data && data.sources[0];
	let url = src && Url.parse(src.source[0]);

	if (!data || !/^kaltura/i.test(src.service)) {
		return url;
	}

	url = Url.parse('');
	url.protocol = src.service;
	url.host = '//';
	url.pathname = src.source[0];

	return url;
}


export function getHandler (src) {
	let url = (typeof src === 'string') ? Url.parse(ensureProtocol(src)) : getUrl(src);
	let service = ((src.sources || [])[0] || {}).service;

	let handler = serviceMap[service];

	if (url && !handler) {
		handler = null;
		if (kalturaRe.test(url.protocol)) {
			handler = kaltura;
		}

		else if (vimeoRe.test(url.host) || vimeoRe.test(url.protocol)) {
			handler = vimeo;
		}

		else if (youtubeRe.test(url.host)) {
			handler = youtube;
		}
	}

	return handler;
}
