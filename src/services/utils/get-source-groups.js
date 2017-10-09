import {getScreenWidth} from 'nti-lib-dom';

function normalizeSource (src) {
	return typeof src === 'string' ? {source: src} : src;
}

function getResolutionForSource (src) {
	return src.height != null && src.width != null ? `${src.height}p` : 'default';
}

function getWidthOfGroup (group) {
	return group.reduce((m, s) => Math.min(m, s.width || 0), -1);
}

export default function (sources) {
	if (!Array.isArray(sources)) { sources = [sources]; }

	const screenWidth = getScreenWidth();
	const groups = {};

	//Group the sources by resolution
	for (let source of sources) {
		const normSrc = normalizeSource(source);
		const resolution = getResolutionForSource(normSrc);

		if (!groups[resolution]) {
			groups[resolution] = [normSrc];
		} else {
			groups[resolution].push(normSrc);
		}
	}

	const resolutions = Object.keys(groups);

	let maxWidth = -1;
	let preferredResolution = 'default';

	for (let resolution of resolutions) {
		const width = getWidthOfGroup(groups[resolution]);

		if (width > maxWidth && width < screenWidth) {
			maxWidth = width;
			preferredResolution = resolution
		}
	}

	return resolutions.map(resolution => {
		return {
			default: preferredResolution === resolution,
			name: resolution,
			sources: groups[resolution]
	});
}
