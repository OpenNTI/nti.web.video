import moment from 'moment';

export default function getTime (time) {
	let date = new Date(time * 1000);
	return moment(date).format('MMMM Do YYYY, h:mm:ss a');
}
