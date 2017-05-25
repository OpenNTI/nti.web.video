/*eslint react/no-multi-comp:0 react/display-name:0*/
import url from 'url';

import React from 'react';
import Logger from 'nti-util-logger';

import getSources from './SourceGrabber';
import selectSources from './SelectSources';


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

/**
 * @class KalturaVideo
 *
 * The Kaltura Video source implementation
 */
export default React.createClass({
	displayName: 'KalturaVideo',

	statics: {
		service: 'kaltura',
		/**
		 * ID should take the form `${partnerId}/${entryId}` for consistency
		 * with Vimeo and YouTube (and the Video component), but in rst the
		 * server expects `${partnerId}:${entryId}`.
		 * @param  {string} url kaltura video href
		 * @return {string} id of the form `${partnerId}/${entryId}`
		 */
		getIDParts (url) {
			if (Array.isArray(url)) {
				return url;
			};
			const [service, rest] = url.split('://');
			if (!(/^kaltura/i.test(service) && rest)) {
				return;
			}

			const [providerId, videoId] = rest.split('/');
			if (!(providerId && videoId)) {
				return;
			}

			return [providerId, videoId];
		},
		getURLID (url) {
			const parts = [...this.getIDParts(url),];
			const urlId = parts && Array.isArray(parts) && parts.join('/');
			return `${urlId}/`; //trailing / is required...
		},
		getID (url) {
			const parts = this.getIDParts(url);
			return parts && Array.isArray(parts) && parts.join(':');
		},
		getCanonicalURL (url) {
			const id = this.getURLID(this.getIDParts(url));
			return `kaltura://${id}`;
		}
	},

	propTypes: {
		/**
		 * Either a URL string or a source descriptor object.
		 *
		 * @type {String/MediaSource}
		 */
		source: React.PropTypes.any.isRequired,

		autoPlay: React.PropTypes.bool,
		deferred: React.PropTypes.bool,

		onPlaying: React.PropTypes.func,
		onPause: React.PropTypes.func,
		onEnded: React.PropTypes.func,
		onSeeked: React.PropTypes.func,
		onTimeUpdate: React.PropTypes.func,
		onError: React.PropTypes.func
	},

	attachRef (x) { this.video = x; },

	getInitialState () {
		return {
			sources: [],
			sourcesLoaded: false,
			isError: false,
			interacted: false
		};
	},


	componentWillMount () {
		this.setupSource(this.props);
	},


	componentWillReceiveProps (nextProps) {
		if (this.props.source !== nextProps.source) {
			this.setupSource(nextProps);
		}
	},


	componentDidMount () {
		// this.setupSource(this.props);
	},


	setupSource (props = this.props) {
		const data = props.source;
		// kaltura://1500101/0_4ol5o04l/
		const src = typeof data === 'string' && data;

		let partnerId;
		let entryId;

		if (src) {
			const parsed = src && url.parse(src);
			partnerId = parsed.host;
			entryId = /\/(.*)\/$/.exec(parsed.path)[1];
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
				if(this.state.entryId === entryId) {
					events.debug('Resolved Sources: %o', sources);
					this.setSources(sources);
				} else {
					events.debug('Ignoring late sources resolve for %s', entryId);
				}

			})
			.catch(error => events.error('Error setting video source %s %o', entryId, error))
		);
	},


	setSources (data) {
		const {state: {quality, interacted}, props: {autoPlay}} = this;

		const qualityPreference = quality;//TODO: allow selection...
		const sources = selectSources(data.sources || [], qualityPreference);
		const availableQualities = sources.qualities;

		events.debug('Selected sources: %o', sources);

		this.setState({
			duration: data.duration,
			poster: data.poster,
			sources: sources,
			allSources: data.sources,
			qualities: availableQualities,
			sourcesLoaded: true,
			isError: (data.objectType === 'KalturaAPIException')
		}, () => {
			const {video, state: {isError}} = this;

			if (isError) {
				this.onError();
			}

			if (video) {
				video.load();
			}

			if (autoPlay || interacted) {
				this.play();
			}
		});
	},


	componentWillUpdate (nextProps) {
		if (nextProps.source !== this.props.source) {
			this.setState(this.getInitialState());
		}
	},


	componentDidUpdate (prevProps) {
		const {video} = this;

		if (video) {
			//attempt to tell the WebView to play inline...
			video.setAttribute('webkit-playsinline', true);
		}

		if (prevProps.source !== this.props.source) {
			if (video) {
				events.debug('Loading');
				video.load();
			}
		}
	},


	render () {
		const {props: {deferred}, state: {poster, sourcesLoaded, isError, interacted, sources = []}} = this;

		if(isError) {
			return (<div className="error">Unable to load video.</div>);
		}

		let videoProps = Object.assign({}, this.props, {
			controls: true,// !/iP(hone|od)/i.test(navigator.userAgent),
			poster,
			src: null,
			source: null,
			onClick: this.onClick
		});

		Object.keys(this.props).forEach(key => {
			if (/^on/i.test(key)) {
				videoProps[key] = null;
			}
		});

		const interactedClass = interacted ? 'loaded' : '';
		const posterStyle = poster ? {backgroundImage: `url(${poster})`} : null;

		return (
			<div className={'video-wrapper ' + interactedClass}>
				{!sourcesLoaded ? (
					<Loading/>
				) : (
					<video {...videoProps}
						ref={this.attachRef}
						onError={this.onError}
						onPlaying={this.onPlaying}
						onPause={this.onPause}
						onEnded={this.onEnded}
						onSeeked={this.onSeeked}
						onTimeUpdate={this.onTimeUpdate}>
						{(deferred && !interacted) ? null : sources.map(source=> (
							<source key={source.src} src={source.src} type={source.type}/>
						))}
					</video>
				)}
				{!interacted && ( <a className="tap-area play" href="#" onClick={this.onClick} style={posterStyle}/>)}
			</div>
		);
	},


	onPlaying (e) {
		const {props: {onPlaying}} = this;
		events.debug('playing %o', e);
		if (onPlaying) {
			onPlaying(e);
		}
	},


	onPause (e) {
		const {props: {onPause}} = this;
		events.debug('pause %o', e);
		if (onPause) {
			onPause(e);
		}
	},


	onEnded (e) {
		const {props: {onEnded}} = this;
		events.debug('ended %o', e);

		this.setState({interacted: false}, () => {

			this.setCurrentTime(0);
			this.stop();

		});

		if (onEnded) {
			onEnded(e);
		}
	},


	onSeeked (e) {
		const {props: {onSeeked}} = this;
		events.debug('seeked %o', e);
		if (onSeeked) {
			onSeeked(e);
		}
	},


	onTimeUpdate (e) {
		const {target: video} = e;
		const {props: {onTimeUpdate}, state: {interacted}} = this;
		events.debug('timeUpdate %o', e);

		if (!interacted && !video.paused && video.currentTime > 0.05) {
			this.setState({interacted: true});
		}

		if (onTimeUpdate) {
			onTimeUpdate(e);
		}
	},


	onError (event) {
		events.debug('error %o', event);
		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});

		if (this.props.onError) {
			this.props.onError();
		}
	},


	onClick (e) {
		const {state: {interacted}, video} = this;

		if (e) {
			e.stopPropagation();
		}

		if (interacted && /Gecko\//.test(navigator.userAgent)) {
			return;
		}

		if (e) {
			e.preventDefault();
		}

		if (video) {
			if (video.paused || video.ended) {
				this.play();
			} else {
				this.pause();
			}
		}
	},


	play () {
		const {video} = this;
		this.setState({interacted: true});

		commands.debug('play');

		if (video && video.play) {
			video.play();
		}
	},


	pause () {
		const {video} = this;
		commands.debug('pause');
		if (video && video.pause) {
			video.pause();
		}
	},


	stop () {
		const {video} = this;
		commands.debug('stop');
		if (video && video.stop) {
			video.stop();
		}
	},


	setCurrentTime (time) {
		const {video} = this;
		commands.debug('setCurrentTime = %s', time);
		if (video) {
			video.currentTime = time;
		}
	}
});
