/* eslint-env jest */
import isValid from '../is-valid';

describe('Are Transcripts Valid', () => {
	test('Conflicting combinations', () => {
		const transcripts = [
			{
				lang: 'EN',
				purpose: 'normal',
			},
			{
				lang: 'EN',
				purpose: 'caption',
			},
			{
				lang: 'EN',
				purpose: 'normal',
			},
		];

		expect(isValid(transcripts)).toBe(false);
	});

	test('Non-conflicting combinations', () => {
		const transcripts = [
			{
				lang: 'EN',
				purpose: 'normal',
			},
			{
				lang: 'EN',
				purpose: 'caption',
			},
			{
				lang: 'CH',
				purpose: 'normal',
			},
		];

		expect(isValid(transcripts)).toBe(true);
	});
});
