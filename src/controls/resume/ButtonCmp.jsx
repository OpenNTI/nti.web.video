import { SeekTo } from '../SeekTo';

export default styled(SeekTo)`
transition: max-width 0.5s, opacity 0.5s;
max-width: var(--button-width);
opacity: 1;
white-space: nowrap;
overflow: hidden;

&.hidden {
	position: fixed;
	visibility: hidden;
	opacity: 0;
}

&.collapsed {
	opacity: 0;
	max-width: 0;
	padding: 0;
	margin: 0;
}
`;
