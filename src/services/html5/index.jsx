import React from 'react';

import {getEventTarget} from 'nti-lib-dom';

import {EventHandlers} from '../../Constants';


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

		autoPlay: React.PropTypes.bool
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
			error: false,
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
				<video {...videoProps}/>
				{!interacted && <a className="tap-area play" href="#" onClick={this.doPlay} style={{backgroundColor: 'transparent'}}/>}
			</div>
		);
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
			console.log('doPlay');
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
