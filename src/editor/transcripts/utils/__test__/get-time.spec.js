/* eslint-env jest */
import getTime from '../get-time';

describe('Get Time', () => {
	test('Get time', () => {
		expect(getTime(1225473123))
			.toBe('October 31st 2008, 12:12:03 pm');
	});
});
