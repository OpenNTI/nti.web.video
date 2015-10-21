const isSource = RegExp.prototype.test.bind(/source/i);

const FORMAT_RANKS = {
	'application/vnd.apple.mpegurl': 0,
	'video/webm': 5,
	'video/mp4': 10
};


const getScreenWidth = () =>
	(global.screen || {}).width
		|| global.innerWidth
		|| ((global.document || {}).documentElement || {}).clientWidth;


const getRank = o=> FORMAT_RANKS[o.type] || 0;


export default function (list, targetQuality) {
	let chosen = [];
	let types = {};

	//Bin by type
	list.forEach(s => {
		let b = types[s.type] = (types[s.type] || []);
		b.push(s);
	});


	Object.keys(types).forEach(mimeType => {
		let pick = pickBestMatchFrom(types[mimeType], targetQuality);
		if (pick) {
			chosen.push(pick);
		}
	});

	chosen.sort((a, b)=> getRank(a) - getRank(b) );

	return chosen;
}

//export const QUALITY_TARGETS = {};

const findMin = (prop) => (m, s) => Math.min(m, s[prop]);
//const findMax = (prop) => (m,s) => Math.max(m,s[prop]);


function pickBestFromScreenSize (list) {
	if (list.length === 1) { return list[0]; }

	let screenWidth = getScreenWidth();
	let minSourceWidth = list.reduce(findMin('width'), Infinity);
	let target = Math.max(screenWidth, minSourceWidth);

	list = list.filter(o => {
		// Filter out the sources wider then the screen (if they want those they
		// can MANUALLY select it)
		return o.width <= target ||
		// Also, just incase the screen is wide enough to let the source video
		// in, strip it out. (again, if they want to play this one, they have
		// to manually select it.)
		isSource(o.tags);
	});

	//Make sure the list is in smallest -> biggest order
	list.sort((a, b) => {
		let x = a.width,
			y = b.width;

		//If the widths are the same, compare bitrates
		if (a.width === b.width) {
			x = a.bitrate;
			y = b.bitrate;
		}

		return x < y ? -1 : 1;
	});

	//pic the highest quality for the target width.
	return list[list.length - 1];
}



function pickBestMatchFrom (list, target) {
	if (!target) {
		return pickBestFromScreenSize(list);
	}

	//TODO: implement target selection.
	return list[0];
}
