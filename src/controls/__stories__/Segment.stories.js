
import { Segment } from '../Segment';
import { VideoContext } from '../../Context';
import { YouTubeSrc, Player, argTypes } from '../../__stories__/VideoSources';

const active = css`
	text-decoration: underline;
`;

export default {
	title: 'Controls/Segment',
	component: Segment
};

export const Base = (props) => (
	<VideoContext>
		<Player src={YouTubeSrc} {...props} />
		<Segment start={0} end={10} classNames={{active}}>0-10 Seconds</Segment><br />
		<Segment start={10} end={20} classNames={{active}}>10-20 Seconds</Segment><br />
		<Segment start={20} end={30}>20-30 Seconds (no active state)</Segment>
	</VideoContext>
);

Base.argTypes = argTypes;
