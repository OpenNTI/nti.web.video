import Chooser from './components/Chooser';

export function selectFrom(course, onSelect) {
	return Chooser.show(course, onSelect);
}

export default Chooser;
