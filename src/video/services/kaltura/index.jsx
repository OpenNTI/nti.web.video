import React from 'react';
import getSources from './SourceGrabber';
import selectSources from './SelectSources';

import url from 'url';

import {EventHandlers} from '../../Constants';

/**
 * @class KalturaVideo
 *
 * The Kaltura Video source implementation
 */
export default React.createClass({
	displayName: 'KalturaVideo',

	statics: {
		service: 'kaltura'
	},

	propTypes: {
		/**
		 * Either a URL string or a source descriptor object.
		 *
		 * @type {String/MediaSource}
		 */
		source: React.PropTypes.any.isRequired,

		autoPlay: React.PropTypes.bool,
		deferred: React.PropTypes.bool
	},


	getDefaultProps () {
		let p = {};

		// default no-op video event handlers
		Object.keys(EventHandlers)
			.forEach(eventname=>(
				p[EventHandlers[eventname]] =
					e=>console.warn('No handler specified for video event \'%s\'', e.type)
				)
			);

		return p;
	},


	getInitialState () {
		return {
			sources: [],
			sourcesLoaded: false,
			isError: false,
			listening: false,
			interacted: false
		};
	},


	componentDidMount () {
		this.setupSource(this.props);
	},


	componentWillReceiveProps (nextProps) {
		if (this.props.source !== nextProps.source) {
			this.setupSource(nextProps);
		}
	},


	setupSource (props) {
		let data = props.source;
		// kaltura://1500101/0_4ol5o04l/
		let src = typeof data === 'string' && data;
		let parsed = src && url.parse(src);

		let partnerId;
		let entryId;

		if (src) {
			partnerId = parsed.host;
			entryId = /\/(.*)\/$/.exec(parsed.path)[1];
		} else if (data) {
			let {source = ''} = data;
			if (Array.isArray(source)) {
				source = source[0];
			}

			parsed = (source || '').split(':');
			partnerId = parsed[0];
			entryId = parsed[1];
		}

		this.setState({
			partnerId: partnerId
		});

		getSources({ entryId: entryId, partnerId: partnerId })
			.then(this.setSources);
	},


	setSources (data) {
		if (!this.isMounted()) {
			return;
		}

		let qualityPreference = this.state.quality;//TODO: allow selection...
		let sources = selectSources(data.sources || [], qualityPreference);
		let availableQualities = sources.qualities;

		this.setState({
			duration: data.duration,
			poster: data.poster,
			sources: sources,
			allSources: data.sources,
			qualities: availableQualities,
			sourcesLoaded: true,
			isError: (data.objectType === 'KalturaAPIException')
		});

		if (this.state.interacted) {
			this.doPlay();
		}
	},


	componentWillUpdate (nextProps) {
		if (nextProps.source !== this.props.source) {
			this.setState(this.getInitialState());
		}
	},


	componentDidUpdate (prevProps) {
		let {video} = this.refs;
		this.ensureListeningToEvents(video);
		if (prevProps.source !== this.props.source) {
			if (video) {
				video.load();
			}
		}
	},


	componentWillUnmount () {
		let {video} = this.refs;
		if (video) {
			Object.keys(EventHandlers).forEach(eventname =>
				video.removeEventListener(eventname, this.props[EventHandlers[eventname]], false)
			);
		}
	},


	ensureListeningToEvents (video) {
		let {props} = this;
		if (video && !this.state.listening) {
			video.addEventListener('error', this.onError, false);

			if (this.props.autoPlay) {
				this.doPlay();
			}

			//attempt to tell the WebView to play inline...
			video.setAttribute('webkit-playsinline', true);

			Object.keys(EventHandlers).forEach(eventname => {

				video.addEventListener(eventname, props[EventHandlers[eventname]], false);
			});

			this.setState({listening: true});
		}
	},


	render () {

		if(!this.state.sourcesLoaded) {
			return <div className="loading">Loading...</div>;
		}

		if(this.state.isError) {
			return (<div className="error">Unable to load video.</div>);
		}

		let videoProps = Object.assign({}, this.props, {
			ref: 'video',
			controls: !/iP(hone|od)/i.test(navigator.userAgent),
			poster: this.state.poster,
			src: null,
			source: null,
			onClick: this.doPlay
		});

		Object.keys(this.props).forEach(key => {
			if (/^on/i.test(key)) {
				videoProps[key] = null;
			}
		});

		let interacted = this.state.interacted ? 'loaded' : '';

		return (
			<div className={'video-wrapper ' + interacted}>
				<video {...videoProps}>
					{this.renderSources()}
				</video>
				{!this.state.interacted && <a className="tap-area play" href="#" onClick={this.doPlay}
						style={{backgroundImage: `url(${this.state.poster})`}}/>}
			</div>
		);
	},


	renderSources () {
		let {interacted, sources = {}} = this.state;

		if (this.props.deferred && !interacted) {
			return null;
		}

		return sources.map(source=> (
			<source key={source.src} src={source.src} type={source.type}/>
		));
	},


	onError () {
		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});
	},


	doPlay (e) {
		let {video} = this.refs;
		if (video && video.paused) {
			e.preventDefault();
			e.stopPropagation();

			console.log('doPlay');
			this.play();
		}
	},


	play () {
		let {video} = this.refs;
		this.setState({interacted: true});
		if (video && this.isMounted()) {
			if (video.play) {
				video.play();
			}
		}
	},


	pause () {
		let video = this.refs;
		if (video && this.isMounted()) {
			if (video.pause) { video.pause(); }
		}
	},


	stop () {
		let {video} = this.refs;
		if (video && this.isMounted()) {
			if (video.stop) { video.stop(); }
		}
	},


	setCurrentTime (time) {
		let {video} = this.refs;
		if (video && this.isMounted()) {
			video.currentTime = time;
		}
	}
});
