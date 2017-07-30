import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {scoped} from 'nti-lib-locale';

const HANDLERS = new WeakMap();

const CAPTIONS = 'captions';
const DISABLED = 'disabled';
// const HIDDEN = 'hidden';
// const SHOWING = 'showing';

const DEFAULT_TEXT = {
	none: 'None'
};

const t = scoped('nti-video.controls.more.Captions', DEFAULT_TEXT);

const formatLang = l => l.toUpperCase();

export default class VideoMoreControlCaptions extends React.Component {
	static getFormattedActiveTrack (videoState) {
		const {textTracks} = videoState || {};

		for (let track of textTracks) {
			if (track.kind === CAPTIONS && track.mode !== DISABLED) {
				return formatLang(track.language);
			}
		}

		return t('none');
	}

	static hasPotentialTracks (videoState) {
		const {textTracks} = videoState || {};

		for (let track of textTracks) {
			if (track.kind === CAPTIONS) { return true; }
		}

		return true;
	}

	static propTypes = {
		videoState: PropTypes.shape({
			textTracks: PropTypes.object
		}),
		selectTrack: PropTypes.func,
		unselectAllTracks: PropTypes.func
	}


	get textTracks () {
		const {videoState} = this.props;
		const {textTracks} = videoState || {};

		return Array.from(textTracks) || [];
	}


	get selectedTrack () {
		const {textTracks} = this;

		for (let track of textTracks) {
			if (track.mode !== DISABLED) {
				return track;
			}
		}

		return null;
	}

	selectTrack = (track, e) => {
		e.stopPropagation();
		e.preventDefault();

		const {selectTrack} = this.props;

		if (selectTrack) {
			selectTrack(track);
		}
	}

	unselectAll = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const {unselectAllTracks} = this.props;

		if (unselectAllTracks) {
			unselectAllTracks();
		}
	}


	render () {
		const {textTracks, selectedTrack} = this;

		return (
			<ul className="video-more-control-captions">
				<li onClick={this.unselectAll} className={cx({selected: !selectedTrack})}>
					{!selectedTrack && (<i className="icon-check" />)}
					<span className="label">{t('none')}</span>
				</li>
				{textTracks.map((track, index) => {
					const selected = track === selectedTrack;

					//TODO: Figure out if this is a memory leak
					const handler = HANDLERS.has(track) ? HANDLERS.get(track) : (e) => this.selectTrack(track, e);

					HANDLERS.set(track, handler);

					return (
						<li
							key={index}
							className={cx({selected})}
							onClick={handler}
						>
							{selected && (<i className="icon-check"/>)}
							<span className="label">{formatLang(track.language)}</span>
						</li>
					);
				})}
			</ul>
		);
	}
}
