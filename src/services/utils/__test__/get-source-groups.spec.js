/* eslint-env jest */
import getSourceGroups from '../get-source-groups';

import mockVideoSources from './mock-video-sources.json';

const HLS = 'application/vnd.apple.mpegurl';

describe('Get Source Group Spec', () => {
	const video = document.createElement('video');
	const proto = Object.getPrototypeOf(video);
	const canPlayType = proto.canPlayType;

	beforeEach(() => {
		global.screen = {
			width: 1285,
			height: 1000
		};

		proto.canPlayType = () => true;
	});

	test('Check Default Quality for 1285 Width', () => {
		proto.canPlayType = (type) => type !== HLS;
		const resolutions = getSourceGroups(mockVideoSources);
		const [preferredResolution] = resolutions.filter(res => res.preferred === true);
		expect(preferredResolution.name).toEqual('720p');
	});

	test('Check Default Quality for devices with HLS. Should be auto', () => {
		proto.canPlayType = (type) => type === HLS;
		const resolutions = getSourceGroups(mockVideoSources);
		const [preferredResolution] = resolutions.filter(res => res.preferred === true);
		expect(preferredResolution.name).toEqual('auto');
	});

	afterEach(() => {
		proto.canPlayType =  canPlayType;
	});
});
