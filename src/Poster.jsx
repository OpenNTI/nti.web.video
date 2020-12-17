import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from '@nti/lib-locale';
import { toCSSClassName } from '@nti/lib-dom';
import {Hooks, Monitor, Text, Image} from '@nti/web-commons';

import styles from './Poster.css';

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
			className={cx(className, styles.videoPoster, styles[size])}
			onChange={onSizeChange}
		>
			{asset && (
				<Image.Container className={styles.asset} aspectRatio={AspectRatios[size]}>
					<img src={asset} />
				</Image.Container>
			)}
			<div className={styles.overlay}>
				<div className={styles.button}>
					<span className={styles.play} title={t('play')} onClick={onPlayClick} data-test-id={`play-button-${toCSSClassName(title)}`}/>
					<Text.Condensed className={styles.label} title={title}>{title}</Text.Condensed>
				</div>
			</div>
			{(badges && badges.length > 0) ? (<div className={cx('video-badges', styles.badges)}>{badges}</div>) : null}
			{progress && progress < 1 ?
				(
					<div className={styles.progressBar}>
						<div className={styles.progress} style={{width: `${bucketProgress(progress) * 100}%`}} />
					</div>
				) : null
			}
		</Monitor.ElementSize>
	);
}
