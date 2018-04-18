/* eslint-env jest */
import { getScreenWidth } from '@nti/lib-dom';

import getSourceGroups from '../get-source-groups';

import mockVideoSources from './mock-video-sources.json';


jest.mock('@nti/lib-dom', () => ({
	...require.requireActual('@nti/lib-dom'),
	getScreenWidth: jest.fn().mockReturnValue(1285)
}));

const HLS = 'application/vnd.apple.mpegurl';

describe('Get Source Group Spec', () => {
	const video = document.createElement('video');
	const proto = Object.getPrototypeOf(video);
	const canPlayType = proto.canPlayType;

	beforeEach(() => {

		expect(getScreenWidth()).toBe(1285);

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
