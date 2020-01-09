import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import {Text} from '@nti/web-commons';

import Styles from './Poster.css';
import {createMediaSourceFromUrl} from './services';
import Video from './Video';
import VideoWithAnalytics from './VideoWithAnalytics';

const cx = classnames.bind(Styles);

function useVideoInfo (src) {
	const [info, setInfo] = React.useState(null);
	let unmounted = false;

	const loadInfo = async () => {
		try {
			const video = typeof src === 'string' ? await createMediaSourceFromUrl(src) : src;

			const poster = await video.getPoster();
			const title = video.title ? video.title : await video.getTitle();

			if (!unmounted) {
				setInfo({poster, title});
			}
		} catch (e) {
			if (!unmounted) {
				setInfo(null);
			}
		}
	};

	React.useEffect(() => {
		loadInfo();
		return () => unmounted = true;
	}, [src]);

	return info;
}


function getPlayer (children) {
	if (React.Children.count(children) !== 1) { return null; }

	const child = React.Children.only(children);

	if (child.type === Video || child.type === VideoWithAnalytics) { return child; }

	return null;
}

VideoPoster.propTypes = {
	className: PropTypes.string,
	onClick: PropTypes.func,
	src: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.shape({
			getPoster: PropTypes.func
		})
	])
};
export default function VideoPoster ({src, className, onClick, children}) {
	const [interacted, setInteracted] = React.useState(false);

	const player = getPlayer(children);
	const playerRef = React.createRef();
	const onPlaying = (...args) => {
		if (!interacted) {
			setInteracted(true);
		}

		if (player && player.props.onPlaying) {
			player.props.onPlaying(...args);
		}
	};

	const videoInfo = useVideoInfo(src);

	const {poster, title} = videoInfo || {};
	const posterStyle = poster ? {backgroundImage: `url(${poster})`} : {};
	const onPosterClick = () => {
		setInteracted(true);

		if (playerRef.current) {
			playerRef.current.play();
		}
	};


	return (
		<div className={cx(className, 'video-poster-container', {interacted, 'has-player': Boolean(player)})}>
			{
				player ?
					React.cloneElement(player, {ref: playerRef, onPlaying, src: player.props.src || src}) :
					children
			}
			<div className={cx('poster')} onClick={onPosterClick} style={posterStyle}>
				<div className={cx('controls')}>
					<div className={cx('play-icon')} />
					{title && (<Text.Base className={cx('title')}>{title}</Text.Base>)}
				</div>
			</div>
		</div>
	);

}