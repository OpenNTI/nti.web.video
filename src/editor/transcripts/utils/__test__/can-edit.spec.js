/* eslint-env jest */
import canEdit from '../can-edit';

describe('Can Edit', () => {
	test('Is editable', () => {
		const transcript = {
			Links: [
				{
					rel: 'something',
				},
				{
					rel: 'edit',
				},
			],
		};

		expect(canEdit(transcript)).toBe(true);
	});

	test('Is not editable', () => {
		const transcript = {
			Links: [
				{
					rel: 'something',
				},
			],
		};

		expect(canEdit(transcript)).toBe(false);
	});

	test('Is not editable, no links', () => {
		const transcript = {};

		expect(canEdit(transcript)).toBe(false);
	});
});
