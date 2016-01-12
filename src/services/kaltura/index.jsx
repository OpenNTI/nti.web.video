/*eslint react/no-multi-comp:0 react/display-name:0*/
import React from 'react';
import getSources from './SourceGrabber';
import selectSources from './SelectSources';

import {getEventTarget} from 'nti-lib-dom';
import url from 'url';

function Loading () {
	return (
		<figure className="loading">
			<div className="m spinner"></div>
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
		deferred: React.PropTypes.bool,

		onPlaying: React.PropTypes.func,
		onPause: React.PropTypes.func,
		onEnded: React.PropTypes.func,
		onSeeked: React.PropTypes.func,
		onTimeUpdate: React.PropTypes.func
	},


	getInitialState () {
		return {
			sources: [],
			sourcesLoaded: false,
			isError: false,
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

		this.setState({entryId, partnerId}, () => {
			getSources({ entryId, partnerId })
			.then(sources => {
				if(this.state.entryId === entryId) {
					this.setSources(sources);
				}
			});
		});
	},


	setSources (data) {
		if (!this.isMounted()) {
			return;
		}

		const {state: {quality, interacted}, props: {autoPlay}} = this;

		let qualityPreference = quality;//TODO: allow selection...
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

		if (autoPlay || interacted) {
			this.doPlay();
		}
	},


	componentWillUpdate (nextProps) {
		if (nextProps.source !== this.props.source) {
			this.setState(this.getInitialState());
		}
	},


	componentDidUpdate (prevProps) {
		const {video} = this.refs;

		if (video) {
			//attempt to tell the WebView to play inline...
			video.setAttribute('webkit-playsinline', true);
		}

		if (prevProps.source !== this.props.source) {
			if (video) {
				video.load();
			}
		}
	},


	render () {
		const {poster, sourcesLoaded, isError, interacted} = this.state;

		if(!sourcesLoaded) {
			return <Loading/>;
		}

		if(isError) {
			return (<div className="error">Unable to load video.</div>);
		}

		let videoProps = Object.assign({}, this.props, {
			ref: 'video',
			controls: !/iP(hone|od)/i.test(navigator.userAgent),
			poster,
			src: null,
			source: null,
			onClick: this.doPlay
		});

		Object.keys(this.props).forEach(key => {
			if (/^on/i.test(key)) {
				videoProps[key] = null;
			}
		});

		const interactedClass = interacted ? 'loaded' : '';

		return (
			<div className={'video-wrapper ' + interactedClass}>
				<video {...videoProps}
					onError={this.onError}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					onSeeked={this.onSeeked}
					onTimeUpdate={this.onTimeUpdate}>
					{this.renderSources()}
				</video>
				{!interacted && <a className="tap-area play" href="#" onClick={this.doPlay}
						style={{backgroundImage: `url(${poster})`}}/>}
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


	onPlaying (e) {
		const {props: {onPlaying}} = this;

		if (onPlaying) {
			onPlaying(e);
		}
	},


	onPause (e) {
		const {props: {onPause}} = this;

		if (onPause) {
			onPause(e);
		}
	},


	onEnded (e) {
		const {props: {onEnded}} = this;

		this.setCurrentTime(0);
		this.setState({interacted: false});

		if (onEnded) {
			onEnded(e);
		}
	},


	onSeeked (e) {
		const {props: {onSeeked}} = this;

		if (onSeeked) {
			onSeeked(e);
		}
	},


	onTimeUpdate (e) {
		const {props: {onTimeUpdate}, state: {interacted}} = this;

		if (!interacted) {
			this.setState({interacted: true});
		}

		if (onTimeUpdate) {
			onTimeUpdate(e);
		}
	},


	onError () {
		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});
	},


	doPlay (e) {
		let isAnchor = e && getEventTarget(e, 'a');
		let {video} = this.refs;
		if (!video || video.paused) {
			return;
		}

		if (isAnchor) {
			e.preventDefault();
			e.stopPropagation();
		}

		this.play();
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
