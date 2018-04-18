import {getScreenWidth} from '@nti/lib-dom';

import canPlayType from './can-play-type';

const AUTO_TYPES = {
	'application/vnd.apple.mpegurl': true
};


export default function (sources) {
	if (!sources) {
		return [];
	}

	if (sources.source && Array.isArray(sources.source) && sources.type) {
		sources = sources.source.map((src, index) => {
			return {
				src,
				type: sources.type[index]
			};
		});
	}

	if (!Array.isArray(sources)) { sources = [sources]; }

	sources = sources.filter(src => canPlayType(src.type));

	const screenWidth = getScreenWidth();
	const MAX_ALLOWED_DEFAULT_WIDTH = Math.min(screenWidth, 1280); // Screen width for 720p
	const groups = getResolutionGroups(sources);

	const resolutions = Object.keys(groups)
		//ensure resolutions are smallest to biggest (assuming heights are the same ratio)
		.sort((a, b) => {
			if (a === 'auto') { return -1; }
			if (b === 'auto') { return 1; }

			return getWidthOfGroup(groups[a]) - getWidthOfGroup(groups[b]);
		});

	let maxWidth = -1;
	let preferredResolution = 'auto';

	for (let resolution of resolutions) {
		if (resolution === 'auto') {
			preferredResolution = 'auto';
			break;
		}

		const width = getWidthOfGroup(groups[resolution]);

		if (width > maxWidth && width <= MAX_ALLOWED_DEFAULT_WIDTH) {
			maxWidth = width;
			preferredResolution = resolution;
		}
	}

	//if we haven't found a preferredResolution, pick the closest.
	if (maxWidth === -1 && resolutions.length > 0 && !groups.auto) {
		preferredResolution = resolutions[0];
		maxWidth = getWidthOfGroup(groups[preferredResolution]);
	}

	return resolutions
		.sort((a, b) => {
			//Sort auto to the end
			if (a === 'auto') { return 1; }
			if (b === 'auto') { return -1; }

			//Sort default to the front
			if (a === 'default') { return -1; }
			if (b === 'default') { return 1; }

			const aWidth = parseInt(a, 10);
			const bWidth = parseInt(b, 10);

			//Sort smaller resolutions to the front
			return aWidth - bWidth;
		})
		.map((resolution) => {
			return {
				preferred: preferredResolution === resolution,
				name: resolution,
				sources: groups[resolution]
			};
		});
}


function normalizeSource (src) {
	if (typeof src === 'string') { return {src}; }
	if (typeof src.src === 'string') { return src; }

	return null;
}

function getResolutionForSource (src) {
	if (src.type && AUTO_TYPES[src.type]) { return 'auto'; }

	return src.height != null && src.width != null ? `${src.height}p` : 'default';
}

function getWidthOfGroup (group) {
	return group.reduce((m, s) => Math.max(m, s.width || 0), -1);
}

function getResolutionGroups (sources) {
	return sources.reduce((groups, source) => {
		const normSrc = normalizeSource(source);

		//If we can't normalize the source
		//don't add it to the groups
		if (!normSrc) { return groups; }

		const resolution = getResolutionForSource(normSrc);

		if (!groups[resolution]) {
			groups[resolution] = [normSrc];
		} else {
			groups[resolution].push(normSrc);
		}

		return groups;
	}, {});
}
