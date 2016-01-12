/**
 * Stand alone source grabber.
 * grabbed from http://player.kaltura.com/kWidget/kWidget.getSources.js
 */

import QueryString from 'query-string';
import {thatReturnsArgument as is} from 'fbjs/lib/emptyFunction';

const test = RegExp.prototype.test;
const isHLS = test.bind(/ip(hone|ad)new/i);
const isAppleMBR = test.bind(/applembr/i);
const isOGG = test.bind(/^og[gv]$/i);
const isWebM = test.bind(/webm|matroska/i);
const isMP4 = test.bind(/mp4/i);
const is3gp = test.bind(/3gp/i);

function kalturaSig (str) {
	let hash = 0;
	if (str.length === 0) { return hash; }
	for (let i = 0; i < str.length; i++) {
		let currentChar = str.charCodeAt(i);
		/* eslint-disable no-bitwise */
		hash = ((hash << 5) - hash) + currentChar;
		hash = hash & hash;
		/* eslint-enable no-bitwise */
	}
	return hash;
}


function parseResult ( result ) { // API result

	let protocol = location.protocol.substr(0, location.protocol.length - 1);
	// Set the service url based on protocol type
	let serviceUrl = (protocol === 'https') ?
		'://www.kaltura.com' :
		'://cdnbakmi.kaltura.com';

	let data = result[1];
	let entryInfo = result[2];
	let assets = data.flavorAssets || [];

	let baseUrl = protocol + serviceUrl + '/p/' + entryInfo.partnerId +
			'/sp/' + entryInfo.partnerId + '00/playManifest';

	let adaptiveFlavors = assets.map(a => isHLS(a.tags) && a.id).filter(is);

	let deviceSources = assets
		.filter(asset=> asset.status === 2 && asset.width)
		.map(asset => {
			let src = baseUrl + '/entryId/' + asset.entryId;
			let source = {
				bitrate: asset.bitrate * 8,
				width: asset.width,
				height: asset.height,
				tags: asset.tags
			};

			// Check if Apple http streaming is enabled and the tags include applembr ( single stream HLS )
			if ( isAppleMBR(asset.tags)) {
				return {
					type: 'application/vnd.apple.mpegurl',
					src: `${src}/format/applehttp/protocol/${protocol}/a.m3u8`
				};
			}

			src += '/flavorId/' + asset.id + '/format/url/protocol/' + protocol;

			if ( isMP4(asset.fileExt) || asset.containerFormat === 'isom') {
				source.src = src + '/a.mp4';
				source.type = 'video/mp4';
			}

			if ( isOGG(asset.fileExt) || isOGG(asset.containerFormat)) {
				source.src = src + '/a.ogg';
				source.type = 'video/ogg';
			}

			if ( isWebM(asset.fileExt) || isWebM(asset.tags) || isWebM(asset.containerFormat)) {
				source.src = src + '/a.webm';
				source.type = 'video/webm';
			}

			if (is3gp(asset.fileExt)) {
				source.src = src + '/a.3gp';
				source.type = 'video/3gp';
			}

			return source;
		})
		.filter(s => s.src);


	// Add the flavor list adaptive style urls ( multiple flavor HLS ):
	if ( adaptiveFlavors.length !== 0 ) {
		deviceSources.push({
			'data-flavorid': 'HLS',
			type: 'application/vnd.apple.mpegurl',
			src: `${baseUrl}/entryId/${entryInfo.id}/flavorIds/${adaptiveFlavors.join(',')}/format/applehttp/protocol/${protocol}/a.m3u8`
		});
	}


	let w = 1280;
	let poster =	'//www.kaltura.com/p/' + entryInfo.partnerId +
					'/thumbnail/entry_id/' + entryInfo.id +
					'/width/' + w + '/';

	return {
		objectType: data.objectType,
		code: data.code,
		poster: poster,
		duration: entryInfo.duration,
		name: entryInfo.name,
		entryId: entryInfo.id,
		description: entryInfo.description,
		sources: deviceSources
	};
}


export default function getSources (settings) {

	let param = {
		service: 'multirequest',
		apiVersion: '3.1',
		expiry: '86400',
		clientTag: 'kwidget:v2.18',
		format: 9,
		ignoreNull: 1,
		action: 'null',

		'1:service': 'session',
		'1:action': 'startWidgetSession',
		'1:widgetId': '_' + settings.partnerId,

		'2:ks': '{1:result:ks}',
		'2:contextDataParams:referrer': document.URL,
		'2:contextDataParams:objectType': 'KalturaEntryContextDataParams',
		'2:contextDataParams:flavorTags': 'all',
		'2:service': 'baseentry',
		'2:entryId': settings.entryId,
		'2:action': 'getContextData',

		'3:ks': '{1:result:ks}',
		'3:service': 'baseentry',
		'3:action': 'get',
		'3:version': '-1',
		'3:entryId': settings.entryId
	};

	//Do not alter these three lines
	param.kalsig = kalturaSig(QueryString.stringify(param));
	param.format = 1;
	delete param.service;

	let url = 'https://cdnapisec.kaltura.com/api_v3/index.php?service=multirequest&' + QueryString.stringify(param);

	return fetch(url)
		.then(x => x.json())
		.then(parseResult);
}
