/*eslint react/no-multi-comp:0 react/display-name:0*/
import url from 'url';

import React from 'react';
import PropTypes from 'prop-types';
import Logger from 'nti-util-logger';

import Video from '../html5/';
import {createNonRecoverableError} from '../utils';

import getSources from './SourceGrabber';
// import selectSources from './SelectSources';


const commands = Logger.get('video:kaltura:commands');
const events = Logger.get('video:kaltura:events');

function Loading () {
	return (
		<figure className="loading">
			<div className="m spinner"/>
			<figcaption>Loading...</figcaption>
		</figure>
	);
}

const initialState = {
	sources: [],
	sourcesLoaded: false,
	isError: false,
	interacted: false
};

/**
 * @class KalturaVideo
 *
 * The Kaltura Video source implementation
 */

export default class KalturaVideo extends React.Component {

	static service = 'kaltura';

	static normalizeUrl = href => {
		const forceTrailingSlash = x => String(x).substr(-1) === '/' ? x : `${x}/`;

		if (/^kaltura/i.test(href)) {
			return forceTrailingSlash(href);
		}

		const parseEmbedSrc = src => {
			const srcRegex = /^.*\/partner_id\/(\w*).*entry_id=(\w*).*$/gi;
			const [, partnerId, entryId] = src.split(srcRegex);

			if (partnerId && entryId) {
				return `kaltura://${partnerId}/${entryId}/`;
			}

			return src;
		};

		if (href.includes('/p/') && href.includes('/sp/')) {
			return parseEmbedSrc(href);
		}

		const parts = url.parse(href, true);

		if (href.includes('/id/')) {
			const partnerId = parts.query.playerId;
			const pathname = parts.pathname.split('/id/');
			const entryId = pathname[pathname.length - 1];
			return `kaltura://${partnerId}/${entryId}/`;
		}

		if (href.includes('index.php')) {
			const regex = /\/partner_id\/(\d*)\/.*\/entry_id\/(\w*)/gi;

			const [, partnerId, entryId] = parts.path.split(regex);
			if (partnerId && entryId) {
				return `kaltura://${partnerId}/${entryId}/`;
			}
		}

		return href;
	};

	/**
	 * ID should take the form `${partnerId}/${entryId}` for consistency
	 * with Vimeo and YouTube (and the Video component), but in rst the
	 * server expects `${partnerId}:${entryId}`.
	 * @param  {string} href kaltura video href
	 * @return {string} id of the form `${partnerId}/${entryId}`
	 */
	static getIDParts (href) {
		if (Array.isArray(href)) {
			return href;
		}

		const [service, rest] = this.normalizeUrl(href).split('://');
		if (!(/^kaltura/i.test(service) && rest)) {
			return;
		}

		const [providerId, videoId] = rest.split('/');
		if (!(providerId && videoId)) {
			return;
		}

		return [providerId, videoId];
	}


	static getURLID (href) {
		const parts = [...this.getIDParts(href)];
		const hrefId = parts && Array.isArray(parts) && parts.join('/');
		return `${hrefId}/`; //trailing / is required...
	}


	static getID (href) {
		const parts = this.getIDParts(href);
		return parts && Array.isArray(parts) && `${parts.join(':')}`;
	}


	static getCanonicalURL (href, videoId) {
		const id = videoId || this.getURLID(this.getIDParts(href));
		return `kaltura://${id}`;
	}

	static propTypes = {
		/**
		 * Either a URL string or a source descriptor object.
		 *
		 * @type {string|MediaSource}
		 */
		source: PropTypes.any.isRequired,

		autoPlay: PropTypes.bool,
		deferred: PropTypes.bool,

		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onError: PropTypes.func
	}

	state = initialState;


	attachRef = (x) => this.video = x


	componentWillMount () {
		this.setupSource(this.props);
	}


	componentWillReceiveProps (nextProps) {
		if (this.props.source !== nextProps.source) {
			this.setupSource(nextProps);
		}
	}


	componentDidMount () {
		// this.setupSource(this.props);
	}


	setupSource (props = this.props) {
		const data = props.source;
		const onError = props.onError;
		// kaltura://1500101/0_4ol5o04l/
		const src = typeof data === 'string' && data;

		let partnerId;
		let entryId;

		if (src) {
			const parsed = src && url.parse(src);
			partnerId = parsed.host;
			entryId = /\/([^/]*)\/?$/.exec(parsed.path)[1];
		} else if (data) {
			let {source = ''} = data;
			if (Array.isArray(source)) {
				source = source[0];
			}

			const parsed = (source || '').split(':');
			partnerId = parsed[0];
			entryId = parsed[1];
		}

		events.debug('Setting source: entryId: %s, partnerId: %s', entryId, partnerId);

		this.setState({entryId, partnerId},

			() => getSources({ entryId, partnerId }).then(sources => {

				if (sources.objectType === 'KalturaAPIException') {
					return onError(createNonRecoverableError(sources.objectType));
				}

				if(this.state.entryId === entryId) {
					events.debug('Resolved Sources: %o', sources);
					this.setSources(sources);
				} else {
					events.debug('Ignoring late sources resolve for %s', entryId);
				}

			})
				.catch(error => events.error('Error setting video source %s %o', entryId, error))
		);
	}


	setSources (data) {
		events.debug('Selected sources: %o', data.sources);

		this.setState({
			duration: data.duration,
			poster: data.poster,
			sources: data.sources,
			sourcesLoaded: true,
			isError: (data.objectType === 'KalturaAPIException')
		});
	}


	componentWillUpdate (nextProps) {
		if (nextProps.source !== this.props.source) {
			this.setState(initialState);
		}
	}


	getPlayerState () {
		const {video} = this;
		const videoState = video ? video.getPlayerState() : {time: 0, duration: 0, speed: 1};

		return {
			...videoState,
			service: KalturaVideo.service
		};
	}


	render () {
		const {poster, sourcesLoaded, isError, sources} = this.state;

		if (isError) {
			return (<div className="error">Unable to load video.</div>);
		}

		const videoProps = {
			...this.props,
			poster,
			sources
		};

		return (
			<div className="kaltura-wrapper">
				{!sourcesLoaded && (<Loading />)}
				{sourcesLoaded && (<Video {...videoProps} ref={this.attachRef} allowNormalTranscripts />)}
			</div>
		);
	}


	play = () => {
		const {video} = this;
		this.setState({interacted: true});

		commands.debug('play');

		if (video && video.play) {
			video.play();
		}
	}


	pause = () => {
		const {video} = this;
		commands.debug('pause');
		if (video && video.pause) {
			video.pause();
		}
	}


	stop = () => {
		const {video} = this;
		commands.debug('stop');
		if (video && video.stop) {
			video.stop();
		}
	}


	setCurrentTime = (time) => {
		const {video} = this;
		commands.debug('setCurrentTime = %s', time);
		if (video) {
			video.setCurrentTime(time);
		}
	}
}
