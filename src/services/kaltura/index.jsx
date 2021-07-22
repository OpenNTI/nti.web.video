/*eslint react/no-multi-comp:0 react/display-name:0*/
import url from 'url';

import React from 'react';
import PropTypes from 'prop-types';

import Logger from '@nti/util-logger';
import { Models } from '@nti/lib-interfaces';

import Video from '../html5/';
import { createNonRecoverableError, isSameSource } from '../utils';

const { MediaSourceFactory } = Models.media;

const commands = Logger.get('video:kaltura:commands');
const events = Logger.get('video:kaltura:events');

const KalturaWrapper = styled.div`
	& video {
		top: 50%;
		transform: translateY(-50%);
	}
`;

function Loading() {
	return (
		<figure className="loading">
			<div className="m spinner" />
			<figcaption>Loading...</figcaption>
		</figure>
	);
}

const initialState = {
	sources: [],
	sourcesLoaded: false,
	isError: false,
};

/**
 * @class KalturaVideo
 *
 * The Kaltura Video source implementation
 */

export default class KalturaVideo extends React.Component {
	static service = 'kaltura';

	static normalizeUrl = href => {
		const forceTrailingSlash = x =>
			String(x).substr(-1) === '/' ? x : `${x}/`;

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
	 *
	 * @param  {string} href kaltura video href
	 * @returns {string} id of the form `${partnerId}/${entryId}`
	 */
	static getIDParts(href) {
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

	static getURLID(href) {
		const parts = [...this.getIDParts(href)];
		const hrefId = parts && Array.isArray(parts) && parts.join('/');
		return `${hrefId}/`; //trailing / is required...
	}

	static getID(href) {
		const parts = this.getIDParts(href);
		return parts && Array.isArray(parts) && `${parts.join(':')}`;
	}

	static getCanonicalURL(href, videoId) {
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
		tracks: PropTypes.array,

		autoPlay: PropTypes.bool,

		onPlaying: PropTypes.func,
		onPause: PropTypes.func,
		onEnded: PropTypes.func,
		onSeeked: PropTypes.func,
		onTimeUpdate: PropTypes.func,
		onError: PropTypes.func,
	};

	state = initialState;

	attachRef = x => (this.video = x);

	componentDidMount() {
		this.setupSource(this.props);
	}

	componentWillUnmount() {
		this.unmounted = true;
	}

	componentDidUpdate({ source }) {
		if (isSameSource(this.props.source, source)) {
			this.setState(initialState);
			this.setupSource();
		}
	}

	async setupSource(props = this.props) {
		const data = props.source;
		const onError = props.onError;
		// kaltura://1500101/0_4ol5o04l/
		const src = typeof data === 'string' && data;

		let partnerId;
		let entryId;

		if (src) {
			const parsed = src && url.parse(src);
			partnerId = parsed.host;
			entryId = /\/:?([^/]*)\/?$/.exec(parsed.path)[1];
		} else if (data) {
			let { source = '' } = data;
			if (Array.isArray(source)) {
				[source] = source;
			}

			const parsed = (source || '').split(':');
			[partnerId, entryId] = parsed;
		}

		events.trace(
			'Setting source: entryId: %s, partnerId: %s',
			entryId,
			partnerId
		);
		this.entryId = entryId; //use this to tell if our async ops finished late
		this.setState({ entryId, partnerId });

		const LATE = new Error();
		const throwIfLate = async pending => {
			const result = pending && (await pending);
			if (this.unmounted || this.entryId !== entryId) {
				throw LATE;
			}
			return result;
		};

		try {
			const service = null; //await throwIfLate(getService());
			const canonicalUrl = KalturaVideo.getCanonicalURL([
				partnerId,
				entryId,
			]);
			const mediaSource = await throwIfLate(
				MediaSourceFactory.from(service, canonicalUrl)
			);
			const resolved = await throwIfLate(mediaSource.getResolver());

			if (resolved.objectType === 'KalturaAPIException') {
				return onError(createNonRecoverableError(resolved.objectType));
			}

			await throwIfLate();

			events.trace('Resolved Sources: %o', resolved);
			this.setSources(resolved);
		} catch (error) {
			if (error === LATE) {
				events.debug('Ignoring late sources resolve for %s', entryId);
				return;
			}

			events.error('Error setting video source %s %o', entryId, error);
			onError(error);
		}
	}

	setSources(data) {
		events.trace('Selected sources: %o', data.sources);

		this.setState({
			duration: data.duration,
			poster: data.poster,
			sources: data.sources,
			sourcesLoaded: true,
			isError: data.objectType === 'KalturaAPIException',
			tracks: data.tracks,
		});
	}

	getPlayerState() {
		const { video } = this;
		const videoState = video
			? video.getPlayerState()
			: { time: 0, duration: 0, speed: 1 };

		return {
			...videoState,
			service: KalturaVideo.service,
		};
	}

	render() {
		const {
			poster,
			sourcesLoaded,
			isError,
			sources,
			tracks: defaultTracks,
		} = this.state;
		const { tracks } = this.props;

		if (isError) {
			return <div className="error">Unable to load video.</div>;
		}

		const videoProps = {
			...this.props,
			poster,
			source: void 0,
			sources,
			crossOrigin: tracks && tracks.length > 0 ? void 0 : 'anonymous',
			tracks: tracks && tracks.length > 0 ? tracks : defaultTracks,
		};

		return (
			<KalturaWrapper className="kaltura-wrapper">
				{!sourcesLoaded && <Loading />}
				{sourcesLoaded && (
					<Video
						{...videoProps}
						ref={this.attachRef}
						allowNormalTranscripts
					/>
				)}
			</KalturaWrapper>
		);
	}

	play = () => {
		const { video } = this;

		commands.debug('play');

		if (video && video.play) {
			video.play();
		}
	};

	pause = () => {
		const { video } = this;
		commands.debug('pause');
		if (video && video.pause) {
			video.pause();
		}
	};

	stop = () => {
		const { video } = this;
		commands.debug('stop');
		if (video && video.stop) {
			video.stop();
		}
	};

	setCurrentTime = time => {
		const { video } = this;
		commands.debug('setCurrentTime = %s', time);
		if (video) {
			video.setCurrentTime(time);
		}
	};
}
