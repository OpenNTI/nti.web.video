/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';

import Kaltura from '../index';


describe('Kaltura Service', () => {
	beforeEach(() => {
		global.fetchBackup = global.fetch;
		global.fetch = (url) => {
			const data = [
				{
					'partnerId': 1500101,
					'ks': 'djJ8MTUwMDEwMXwvhxzhuHGGz5EjPAOn2oj-zzUW1JlHoDrdrZw0pmWKu4iZQ_ZBxMCRjQCPSls887JHBgSbl5dxdnj41jW5cpGPZNwakps1n30iZ7Pz_Q5LNQ==',
					'userId': 0,
					'objectType': 'KalturaStartWidgetSessionResponse'
				},
				{
					'isSiteRestricted': false,
					'isCountryRestricted': false,
					'isSessionRestricted': false,
					'isIpAddressRestricted': false,
					'isUserAgentRestricted': false,
					'previewLength': -1,
					'isScheduledNow': true,
					'isAdmin': false,
					'streamerType': 'http',
					'mediaProtocol': 'https',
					'accessControlMessages': [],
					'accessControlActions': [],
					'flavorAssets': [
						{
							'flavorParamsId': 702572,
							'width': 0,
							'height': 0,
							'bitrate': 56,
							'frameRate': 0,
							'isOriginal': false,
							'isWeb': false,
							'containerFormat': 'isom',
							'status': 2,
							'isDefault': false,
							'id': '0_64doqgsk',
							'entryId': '0_nmii7y4j',
							'partnerId': 1500101,
							'version': '11',
							'size': 861,
							'tags': 'mobile,iphone,iphonenew,ipad,ipadnew',
							'fileExt': 'mp4',
							'createdAt': 1389519959,
							'updatedAt': 1391117040,
							'description': 'n',
							'objectType': 'KalturaFlavorAsset'
						},
						{
							'flavorParamsId': 487091,
							'width': 1920,
							'height': 1072,
							'bitrate': 2552,
							'frameRate': 24,
							'isOriginal': false,
							'isWeb': true,
							'containerFormat': 'isom',
							'videoCodecId': 'avc1',
							'status': 2,
							'isDefault': false,
							'id': '0_hnnfs61u',
							'entryId': '0_nmii7y4j',
							'partnerId': 1500101,
							'version': '1',
							'size': 38912,
							'tags': 'web,mbr',
							'fileExt': 'mp4',
							'createdAt': 1382343491,
							'updatedAt': 1382343681,
							'description': '',
							'objectType': 'KalturaFlavorAsset'
						},
						{
							'flavorParamsId': 0,
							'width': 1920,
							'height': 1080,
							'bitrate': 3851,
							'frameRate': 24,
							'isOriginal': true,
							'isWeb': true,
							'containerFormat': 'mp42',
							'videoCodecId': 'avc1',
							'status': 2,
							'isDefault': false,
							'id': '0_v7modoff',
							'entryId': '0_nmii7y4j',
							'partnerId': 1500101,
							'version': '2',
							'size': 58777,
							'tags': 'source,web',
							'fileExt': 'mp4',
							'createdAt': 1382342741,
							'updatedAt': 1382343063,
							'description': '',
							'objectType': 'KalturaFlavorAsset'
						}
					],
					'msDuration': 125000,
					'pluginData': [],
					'messages': [],
					'actions': [],
					'objectType': 'KalturaEntryContextDataResult'
				},
				{
					'mediaType': 1,
					'conversionQuality': 4642241,
					'sourceType': '1',
					'dataUrl': 'https://cdnapisec.kaltura.com/p/1500101/sp/150010100/playManifest/entryId/0_nmii7y4j/format/url/protocol/https',
					'flavorParamsIds': '0,487041,487051,487061,487071,487081,487091,487111,702572,704451,704461',
					'plays': 4597,
					'views': 171544,
					'lastPlayedAt': 1446267608,
					'width': 1920,
					'height': 1072,
					'duration': 125,
					'msDuration': 125000,
					'id': '0_nmii7y4j',
					'name': 'Janux Promo Video',
					'description': 'Janux, a new interactive learning community created in partnership between The University of Oklahoma and technology leader NextThought, connects learners and teachers through high-quality OU courses. Janux is the first of its kind in OpenCourseWare, combining multimedia-rich content with interactive social tools and a broader learning community to create an unparalleled learning environment.rrCopyright u00a9 2000-2014 The Board of Regents of the University of Oklahoma, All Rights Reserved.',
					'partnerId': 1500101,
					'userId': 'sean.jones@nextthought.com',
					'creatorId': 'sean.jones@nextthought.com',
					'tags': 'janux',
					'categories': 'Promo',
					'categoriesIds': '16001462',
					'status': 2,
					'moderationStatus': 6,
					'moderationCount': 0,
					'type': 1,
					'createdAt': 1382342739,
					'updatedAt': 1445542708,
					'rank': 0,
					'totalRank': 0,
					'votes': 0,
					'downloadUrl': 'https://cdnapisec.kaltura.com/p/1500101/sp/150010100/playManifest/entryId/0_nmii7y4j/format/download/protocol/https/flavorParamIds/0',
					'searchText': '_PAR_ONLY_ _1500101_ _MEDIA_TYPE_1|  Janux Promo Video janux Janux, a new interactive learning community created in partnership between The University of Oklahoma and technology leader NextThought, connects learners and teachers through high-quality OU courses. Janux is the first of its kind in OpenCourseWare, combining multimedia-rich content with interactive social tools and a broader learning community to create an unparalleled learning environment.Copyright u00a9 2000-2014 The Board of Regents of the University of Oklahoma, All Rights Reserved. ',
					'licenseType': -1,
					'version': 0,
					'thumbnailUrl': 'https://cfvod.kaltura.com/p/1500101/sp/150010100/thumbnail/entry_id/0_nmii7y4j/version/100022',
					'accessControlId': 1423091,
					'replacementStatus': 0,
					'partnerSortValue': 0,
					'conversionProfileId': 4642241,
					'rootEntryId': '0_nmii7y4j',
					'operationAttributes': [],
					'entitledUsersEdit': '',
					'entitledUsersPublish': '',
					'entitledUsersView': '',
					'capabilities': '',
					'displayInSearch': 1,
					'objectType': 'KalturaMediaEntry'
				},
				{
					'objects': [
						{
							'captionParamsId': 0,
							'language': 'English',
							'languageCode': 'en',
							'format': '1',
							'status': 2,
							'id': '0_qazodgom',
							'entryId': '0_nmii7y4j',
							'partnerId': 1500101,
							'version': '2',
							'size': 3208,
							'tags': '',
							'fileExt': 'srt',
							'createdAt': 1445542707,
							'updatedAt': 1445542708,
							'description': '',
							'objectType': 'KalturaCaptionAsset'
						}
					],
					'totalCount': 1,
					'objectType': 'KalturaCaptionAssetListResponse'
				}
			];
			const response = {
				json: () => data
			};
			return Promise.resolve(response);
		};
	});

	afterEach(() => {
		global.fetch = global.fetchBackup;
	});

	/*
	*	NTI-4689: Make sure default tracks are pulled in
	*/
	test('should have default tracks', (done) => {
		const wrapper = mount(<Kaltura source={'kaltura://1500101/0_nmii7y4j/'} />);
		window.setTimeout(() => {
			const track = wrapper.find('track').first();
			const trackSrc = 'https://cdnapisec.kaltura.com/api_v3/index.php/service/caption_captionasset/action/serveWebVTT/segmentDuration/155/segmentIndex/1/captionAssetId/0_qazodgom/ks/djJ8MTUwMDEwMXwvhxzhuHGGz5EjPAOn2oj-zzUW1JlHoDrdrZw0pmWKu4iZQ_ZBxMCRjQCPSls887JHBgSbl5dxdnj41jW5cpGPZNwakps1n30iZ7Pz_Q5LNQ==';
			expect(track.prop('src')).toEqual(trackSrc);
			expect(track.prop('srcLang')).toEqual('en');
			expect(track.prop('kind')).toEqual('captions');
			done();
		}, 200);
	});

	/*
	*	NTI-4689: Make sure custom tracks override default
	*/
	test('should have custom tracks', async (done) => {
		const transcript = {
			'Class': 'Transcript',
			'CreatedTime': 1515596862.577514,
			'Creator': 'test@nextthought.com',
			'Last Modified': 1515596862.577514,
			'Links': [
				{
					'Class': 'Link',
					'href': '/dataserver2/NTIIDs/tag%3Anextthought.com%2C2011-10%3ANTI-NTITranscript-system_20180109193631_867872_3762585815.0',
					'method': 'PUT',
					'ntiid': 'tag:nextthought.com,2011-10:NTI-NTITranscript-system_20180109193631_867872_3762585815.0',
					'rel': 'edit'
				}
			],
			'MimeType': 'application/vnd.nextthought.ntitranscript',
			'NTIID': 'tag:nextthought.com,2011-10:NTI-NTITranscript-system_20180109193631_867872_3762585815.0',
			'OID': 'tag:nextthought.com,2011-10:josh.birdwell@nextthought.com-OID-0x04d807:5573657273:y2DnJDy2AAY',
			'lang': 'en',
			'purpose': 'normal',
			'src': '/dataserver2/Objects/tag%3Anextthought.com%2C2011-10%3Asystem-OID-0x04d808%3A5573657273/@@download/test.vtt',
			'srcjsonp': null,
			'type': 'text/vtt'
		};
		const wrapper = mount(<Kaltura source={'kaltura://1500101/0_nmii7y4j/'} tracks={[transcript]} />);
		window.setTimeout(() => {
			const track = wrapper.find('track').first();
			const trackSrc = '/dataserver2/Objects/tag%3Anextthought.com%2C2011-10%3Asystem-OID-0x04d808%3A5573657273/@@download/test.vtt';
			expect(track.prop('src')).toEqual(trackSrc);
			expect(track.prop('srcLang')).toEqual('en');
			expect(track.prop('kind')).toEqual('captions');
			done();
		}, 200);
	});
});