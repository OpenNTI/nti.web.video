import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from '@nti/lib-locale';
import {Hooks, Monitor, Text, Image} from '@nti/web-commons';

import Styles from './Poster.css';

const {useResolver} = Hooks;
const {isResolved} = useResolver;

const Poster = 'poster';
const Thumbnail = 'thumbnail';

const Sizes = [
	{query: size => size.width < 320, size: Thumbnail},
	{query: () => true, size: Poster}
];

const AspectRatios = {
	[Poster]: 16 / 9,
	[Thumbnail]: 15 / 11 //taken from the size in the overview
};

const t = scoped('video.Poster', {
	play: 'Play'
});

function bucketProgress (progress) {
	if (!progress) { return 0; }
	if (progress < 0.25) { return 0.125; }
	if (progress < 0.5) { return 0.25; }
	if (progress < 0.75) { return 0.5; }
	if (progress < 1) { return 0.75; }

	return 1;
}

VideoCurtain.propTypes = {
	className: PropTypes.string,
	video: PropTypes.shape({
		getPoster: PropTypes.func,
		getThumbnail: PropTypes.func,
		title: PropTypes.string,
		label: PropTypes.string
	}),
	progress: PropTypes.number,
	badges: PropTypes.arrayOf(PropTypes.node),

	onPlayClick: PropTypes.func
};
export default function VideoCurtain ({className, video, progress, badges, onPlayClick, ...otherProps}) {
	const [size, setSize] = React.useState(Poster);

	const resolver = useResolver(async () => {
		const poster = await video.getPoster();
		const thumbnail = await video.getThumbnail();

		return {[Poster]: poster, [Thumbnail]: thumbnail};
	}, [video]);

	const assets = isResolved(resolver) ? resolver : null;

	const onSizeChange = React.useCallback(
		(newSize) => setSize(Sizes.find(s => s.query(newSize))?.size)
	);

	const title = video.title || video.label;
	const asset = assets?.[size];

	return (
		<Monitor.ElementSize
			{...otherProps}
			className={cx(className, Styles.videoPoster, Styles[size])}
			onChange={onSizeChange}
		>
			{asset && (
				<Image.Container className={Styles.asset} aspectRatio={AspectRatios[size]}>
					<img src={asset} />
				</Image.Container>
			)}
			{(badges && badges.length > 0) ? (<div className={Styles.badges}>{badges}</div>) : null}
			<div className={Styles.overlay}>
				<div className={Styles.button}>
					<span className={Styles.play} title={t('play')} onClick={onPlayClick} />
					<Text.Condensed className={Styles.label} title={title}>{title}</Text.Condensed>
				</div>
			</div>
			{progress && progress < 1 ?
				(
					<div className={Styles.progressBar}>
						<div className={Styles.progress} style={{width: `${bucketProgress(progress) * 100}%`}} />
					</div>
				) : null
			}
		</Monitor.ElementSize>
	);
}
