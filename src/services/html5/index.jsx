import React from 'react';
import Logger from 'nti-util-logger';

const commands = Logger.get('video:html5:commands');
const events = Logger.get('video:html5:events');

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
				this.play();
			}
		}
	},


	setupSource (props) {
		let {source} = props;
		if (typeof source !== 'string') {
			events.warn('What is this? %o', source);
			source = null;
		}

		events.debug('Setting source: entryId: %s, partnerId: %s', source);
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
			controls: true,
			src,
			source: null,
			onClick: this.onClick
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
				{!interacted && <a className="tap-area play" href="#" onClick={this.onClick} style={{backgroundColor: 'transparent'}}/>}
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

		this.setState({interacted: false}, () => this.setCurrentTime(0));

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
		const {props: {onTimeUpdate}, state: {interacted}} = this;
		events.debug('timeUpdate %o', e);

		if (!interacted && e.target.currentTime > 0) {
			this.setState({interacted: true});
		}

		if (onTimeUpdate) {
			onTimeUpdate(e);
		}
	},


	onError (e) {
		events.debug('error %o', e);
		this.setState({
			error: 'Could not play video. Network or Browser error.'
		});
	},


	onClick (e) {
		const {video} = this.refs;

		if (/Gecko\//.test(navigator.userAgent)) {
			return;
		}

		if (e) {
			e.preventDefault();
			e.stopPropagation();
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
		const {video} = this.refs;
		this.setState({interacted: true});

		commands.debug('play');

		if (video && this.isMounted()) {
			if (video.play) {
				video.play();
			}
		}
	},


	pause () {
		const {video} = this.refs;

		commands.debug('pause');

		if (video) {
			if (video.pause) { video.pause(); }
		}
	},


	stop () {
		const {video} = this.refs;

		commands.debug('stop');

		if (video && video.stop) {
			video.stop();
		}
	},


	setCurrentTime (time) {
		const {video} = this.refs;

		commands.debug('set currentTime = %s', time);

		if (video) {
			video.currentTime = time;
		}
	}
});