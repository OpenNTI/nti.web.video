import Url from 'url';

import {getService} from 'nti-web-client';

import {getModel} from 'nti-lib-interfaces';

import kaltura from './kaltura';
import vimeo from './vimeo';
import youtube from './youtube';

const kalturaRe = /^kaltura/i;
const vimeoRe = /vimeo/i;
const youtubeRe = /youtu(\.?)be/i;

const serviceMap = { youtube, vimeo, kaltura };
const PROTOCOL_LESS = /^\/\//i;
const ensureProtocol = x => PROTOCOL_LESS.test(x) ? `http:${x}` : x;

const MediaSource = getModel('mediasource');

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


function getHandlerFromUrl (url) {
	let handler = null;
	if (kalturaRe.test(url.protocol)) {
		handler = kaltura;
	}

	else if (vimeoRe.test(url.host) || vimeoRe.test(url.protocol)) {
		handler = vimeo;
	}

	else if (youtubeRe.test(url.host)) {
		handler = youtube;
	}
	return handler;
}


export function getHandler (src) {
	let url = (typeof src === 'string') ? Url.parse(ensureProtocol(src)) : getUrl(src);
	let service = ((src.sources || [])[0] || {}).service;

	let handler = serviceMap[service];

	if (url && !handler) {
		handler = getHandlerFromUrl(url);
	}

	return handler;
}


export function createMediaSourceFromUrl (url) {
	const handler = getHandler(url);
	const videoId = handler && handler.getID && handler.getID(url);
	const canonicalUrl = handler && handler.getCanonicalURL && handler.getCanonicalURL(url);

	return getService()
		.then(service => new MediaSource(service, null, {service: handler.service, href: canonicalUrl, source: videoId}))
		.catch(() => Function.prototype());
}

/**
 * Get canonical URL from service and source
 * @param  {string|Object} args - `${service} ${source}` or {service: ..., source: ...}
 * @return {string} canonical url
 */
export function getCanonicalUrlFrom (args) {
	const stringToObjectForm = str => {
		const parts = str.split(' ');
		return parts.length === 2 && {
			service: parts[0],
			source: parts[1]
		};
	};

	const normalForm = typeof args === 'object'
		? args
		: stringToObjectForm(args);

	const handler = getHandlerFromUrl({
		host: normalForm.service,
		protocol: normalForm.service
	});

	// For Kaltura
	const src = String(normalForm.source).split(':').join('/');

	return handler && handler.getCanonicalURL(undefined, src);
}
