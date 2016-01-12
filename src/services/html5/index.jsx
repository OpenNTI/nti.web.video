import React from 'react';
import {getEventTarget} from 'nti-lib-dom';

export default React.createClass({
	displayName: 'HTML5Video',

	statics: {
		service: 'html5'
	},

	propTypes: {
		/**
		 * Either a URL string or a source descriptor object.
		 *
		 * @type {String/MediaSource}
		 */
		source: React.PropTypes.any.isRequired,

		autoPlay: React.PropTypes.bool,

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
			error: false,
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
		const {props: {autoPlay}, refs: {video}} = this;
		if (video) {
			//attempt to tell the WebView to play inline...
			video.setAttribute('webkit-playsinline', true);

			if (autoPlay) {
				this.doPlay();
			}
		}
	},


	setupSource (props) {
		let {source} = props;
		if (typeof source !== 'string') {
			console.warn('What is this?', source);
			source = null;
		}

		this.setState({src: source});
	},


	componentWillUpdate (nextProps) {
		if (nextProps.source !== this.props.source) {
			this.setState(this.getInitialState());
		}
	},


	componentDidUpdate (prevProps) {
		let {video} = this.refs;
		if (prevProps.source !== this.props.source) {
			if (video) {
				video.load();
			}
		}
	},


	render () {
		let {error, interacted, src} = this.state;

		let videoProps = Object.assign({}, this.props, {
			ref: 'video',
			controls: !/iP(hone|od)/i.test(navigator.userAgent),
			src,
			source: null,
			onClick: this.doPlay
		});

		Object.keys(this.props).forEach(key => {
			if (/^on/i.test(key)) {
				videoProps[key] = null;
			}
		});

		return error ? (
			<div className="error">Unable to load video.</div>
		) : (
			<div className={'video-wrapper ' + (interacted ? 'loaded' : '')}>
				<video {...videoProps}
					onError={this.onError}
					onPlaying={this.onPlaying}
					onPause={this.onPause}
					onEnded={this.onEnded}
					onSeeked={this.onSeeked}
					onTimeUpdate={this.onTimeUpdate}
					/>
				{!interacted && <a className="tap-area play" href="#" onClick={this.doPlay} style={{backgroundColor: 'transparent'}}/>}
			</div>
		);
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

		if (!interacted && e.target.currentTime > 0) {
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
		const isAnchor = e && getEventTarget(e, 'a');
		const  {video} = this.refs;
		const paused = video && video.paused;
		const stopEvent = isAnchor || paused;

		if (stopEvent) {
			e.preventDefault();
			e.stopPropagation();
		}

		if (paused) {
			this.play();
		}
	},


	play () {
		const {video} = this.refs;
		this.setState({interacted: true});
		if (video && this.isMounted()) {
			if (video.play) {
				video.play();
			}
		}
	},


	pause () {
		const {video} = this.refs;
		if (video) {
			if (video.pause) { video.pause(); }
		}
	},


	stop () {
		const {video} = this.refs;
		if (video && video.stop) {
			video.stop();
		}
	},


	setCurrentTime (time) {
		const {video} = this.refs;
		if (video) {
			video.currentTime = time;
		}
	}
});
