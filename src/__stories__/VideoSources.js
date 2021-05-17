import Video from '../Video';

export const YouTubeSrc = 'https://www.youtu.be/dQw4w9WgXcQ';
export const VimeoSrc = 'https://vimeo.com/137531269';
export const KalturaSrc = 'kaltura://1500101/0_nmii7y4j/';

const Container = styled.div`
	max-width: 500px;
	width: 98vw;
	padding: 2px;
`;

export const Player = (props) => (
	<Container>
		<Video {...props} />
	</Container>
);

export const argTypes = {
	onTimeUpdate: { action: 'timeupdate' },
	onSeeked: { action: 'seeked' },
	onPlaying: { action: 'playing' },
	onPause: { action: 'paused' },
	onEnded: { action: 'ended' },
	onError: { action: 'error' },
	onReady: { action: 'ready' }
};
