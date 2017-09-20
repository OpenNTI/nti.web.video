/* eslint-env jest */
import getName from '../get-name';

describe('Get Transcript Name', () => {
	test('Get transcript name', () => {
		const transcript = {
			src: 'Objects/tag%3Anextthought.com%2C2011-10%3Asystem-OID-0x218c38%3A5573657273/@@download/a%20%28%29 test.vtt'
		};

		expect(getName(transcript))
			.toBe('a () test.vtt');
	});
});
