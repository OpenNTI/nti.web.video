/* eslint-env jest */
import group from '../group-watched-segments';

const seg = (start, end, count) => ({
	video_start_time: start,
	video_end_time: end,
	count
});

describe('groupWatchSegment tests', () => {
	test('single segment', () => {
		const segment = seg(0, 100, 1);

		expect(group([segment])).toEqual([segment]);
	});

	test('non-overlapping segments', () => {
		const first = seg(0, 50, 1);
		const second = seg(60, 100, 1);

		expect(group([first, second])).toEqual([
			first,
			second
		]);
	});

	test('completely overlapping segments', () => {
		const first = seg(0, 50, 1);
		const second = seg(0, 50, 2);

		expect(group([first, second])).toEqual([
			seg(0, 50, 3)
		]);
	});

	test('same start times', () => {
		const first = seg(0, 50, 1);
		const second = seg(0, 25, 2);

		expect(group([first, second])).toEqual([
			seg(0, 25, 3),
			seg(26, 50, 1)
		]);
	});

	test('same end times', () => {
		const first = seg(0, 50, 1);
		const second = seg(25, 50, 2);

		expect(group([first, second])).toEqual([
			seg(0, 24, 1),
			seg(25, 50, 3)
		]);
	});

	test('one segment contains another', () => {
		const first = seg(0, 50, 1);
		const second = seg(20, 30, 2)

		expect(group([first, second])).toEqual([
			seg(0, 19, 1),
			seg(20, 30, 3),
			seg(31, 50, 1)
		]);
	});

	test('partial overlapping segments', () => {
		const first = seg(0, 50, 1);
		const second = seg(25, 75, 2);

		expect(group([first, second])).toEqual([
			seg(0, 24, 1),
			seg(25, 50, 3),
			seg(51, 75, 2)
		]);
	});
});
