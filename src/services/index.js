import Url from 'url';

import { getService } from '@nti/web-client';
import { getModel } from '@nti/lib-interfaces';

import kaltura from './kaltura';
import vimeo from './vimeo';
import youtube from './youtube';
import wistia from './wistia';

const kalturaRe = /kaltura/i;
const vimeoRe = /vimeo/i;
const youtubeRe = /youtu(\.?)be/i;
const wistiaRe = /wistia/i;

const serviceMap = { youtube, vimeo, kaltura, wistia };
const PROTOCOL_LESS = /^\/\//i;
const ensureProtocol = x => (PROTOCOL_LESS.test(x) ? `http:${x}` : x);

const MediaSource = getModel('mediasource');

function getSource(data) {
	return data && data.sources ? data.sources[0] : data;
}

export function getUrl(data) {
	let src = getSource(data);
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

function getHandlerFromUrl(url) {
	let handler = null;

	if (kalturaRe.test(url.protocol) || kalturaRe.test(url.host)) {
		handler = kaltura;
	} else if (vimeoRe.test(url.host) || vimeoRe.test(url.protocol)) {
		handler = vimeo;
	} else if (youtubeRe.test(url.host)) {
		handler = youtube;
	} else if (wistiaRe.test(url.host)) {
		handler = wistia;
	}

	return handler;
}

export function getHandler(src, srcIndex = 0) {
	let url =
		typeof src === 'string' ? Url.parse(ensureProtocol(src)) : getUrl(src);
	let service = ((src.sources || [])[srcIndex] || {}).service;

	let handler = serviceMap[service];

	if (url && !handler) {
		handler = getHandlerFromUrl(url);
	}

	return handler;
}

export async function createMediaSourceFromUrl(url) {
	const service = await getService();

	return MediaSource.from(service, url);
}

/**
 * Get canonical URL from service and source
 * @param  {string|Object} args - `${service} ${source}` or {service: ..., source: ...}
 * @returns {string} canonical url
 */
export function getCanonicalUrlFrom(args) {
	const stringToObjectForm = str => {
		const parts = str.split(' ');
		return (
			parts.length === 2 && {
				service: parts[0],
				source: parts[1],
			}
		);
	};

	const normalForm =
		typeof args === 'object' ? args : stringToObjectForm(args);

	const handler = getHandlerFromUrl({
		host: normalForm.service,
		protocol: normalForm.service,
	});

	// For Kaltura
	const src = String(normalForm.source).split(':').join('/');

	return handler && handler.getCanonicalURL(undefined, src);
}
