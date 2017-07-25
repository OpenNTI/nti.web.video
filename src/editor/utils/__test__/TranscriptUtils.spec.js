import { isTranscriptEditable, getTime, getTranscriptName, areTranscriptsValid } from '../TranscriptUtils';

/* eslint-env jest */
describe('Is Transcript Editable', () => {
	test('Is editable', () => {
		const transcript = {
			Links: [
				{
					rel: 'something'
				},
				{
					rel: 'edit'
				}
			]
		};

		expect(isTranscriptEditable(transcript))
			.toBe(true);
	});

	test('Is not editable', () => {
		const transcript = {
			Links: [
				{
					rel: 'something'
				}
			]
		};

		expect(isTranscriptEditable(transcript))
			.toBe(false);
	});

	test('Is not editable, no links', () => {
		const transcript = {

		};

		expect(isTranscriptEditable(transcript))
			.toBe(false);
	});
});

describe('Get Time', () => {
	test('Get time', () => {
		expect(getTime(1225473123))
			.toBe('October 31st 2008, 12:12:03 pm');
	});
});

describe('Get Transcript Name', () => {
	test('Get transcript name', () => {
		const transcript = {
			src: 'Objects/tag%3Anextthought.com%2C2011-10%3Asystem-OID-0x218c38%3A5573657273/@@download/a%20%28%29 test.vtt'
		};

		expect(getTranscriptName(transcript))
			.toBe('a () test.vtt');
	});
});

describe('Are Transcripts Valid', () => {
	test('Conflicting combinations', () => {
		const transcripts = [{
			lang: 'EN',
			purpose: 'normal'
		},
		{
			lang: 'EN',
			purpose: 'caption'
		},
		{
			lang: 'EN',
			purpose: 'normal'
		}];

		expect(areTranscriptsValid(transcripts))
			.toBe(false);
	});

	test('Non-conflicting combinations', () => {
		const transcripts = [{
			lang: 'EN',
			purpose: 'normal'
		},
		{
			lang: 'EN',
			purpose: 'caption'
		},
		{
			lang: 'CH',
			purpose: 'normal'
		}];

		expect(areTranscriptsValid(transcripts))
			.toBe(true);
	});
});
