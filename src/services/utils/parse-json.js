export default function (str) {
	try {
		return JSON.parse(str);
	} catch (e) {
		return null;
	}
}
