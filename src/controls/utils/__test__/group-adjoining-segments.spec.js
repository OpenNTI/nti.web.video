/* eslint-env jest */
import { groupAdjoiningSegments as group } from '../segments';

const seg = (start, end) => ({
	video_start_time: start,
	video_end_time: end,
});

describe('groupWatchSegment tests', () => {
	test('single segment', () => {
		const segment = seg(0, 100);

		expect(group([segment])).toEqual([segment]);
	});

	test('non-overlapping segments', () => {
		const first = seg(0, 20);
		const second = seg(30, 50);

		expect(group([first, second])).toEqual([first, second]);
	});

	test('overlapping segments', () => {
		const first = seg(0, 20);
		const second = seg(10, 30);

		expect(group([first, second])).toEqual([seg(0, 30)]);
	});

	test('adjoining segments', () => {
		const first = seg(0, 20);
		const second = seg(21, 30);

		expect(group([first, second])).toEqual([seg(0, 30)]);
	});

	test('contained segments', () => {
		const first = seg(0, 30);
		const second = seg(10, 20);

		expect(group([first, second])).toEqual([seg(0, 30)]);
	});
});
