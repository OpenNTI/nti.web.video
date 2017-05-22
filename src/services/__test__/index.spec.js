import {createMediaSourceFromUrl} from '../';

import vimeoMetaData from './mockMetaData';
import youtubeMetaData from './mockYouTubeMetaData';

/* Valid URLs that *do not* match the mock meta data */
const vimeoUrl = 'http://vimeo.com/217809089';
const youtubeUrl = 'https://www.youtube.com/watch?v=hO7mzO83N1Q';

describe('Create MediaSource From URL tests', () => {

	/*
		Mock global $AppConfig for getService() in createMediaSourceFromUrl
	 */

	const mockSiteName = 'mockSiteName';
	const mockGoogleApiKey = 'mockGoogleApiKey';
	const mockService = {
		get () {
			return new Promise(() => youtubeMetaData);
		},

		getServer () {
			return {
				config: {
					keys: {
						googleapi: {
							default: mockGoogleApiKey,
							[mockSiteName]: mockGoogleApiKey
						}
					}
				}
			};
		},

		getSiteName () {
			return mockSiteName;
		}
	};

	beforeEach(() => {
		global.$AppConfig = {
			nodeService: mockService
		};
	});

	/*
		Actual tests
	 */

	const metaDataTest = (url, metaData) => createMediaSourceFromUrl(url).then(mediaSource => {
		for (let key of Object.keys(metaData)) {
			mediaSource.getProperty(key).then(res => expect(res).toBe(metaData[key]));
		}
	});

	it('should get meta data from Vimeo', () => metaDataTest(vimeoUrl, vimeoMetaData));
	it('should get meta data from YouTube', () => metaDataTest(youtubeUrl, youtubeMetaData));

});