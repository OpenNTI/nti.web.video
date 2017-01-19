import React from 'react';
import Logger from 'nti-util-logger';

import MESSAGES from '../WindowMessageListener';

import {EventHandlers} from '../../Constants';

import uuid from 'node-uuid';
import QueryString from 'query-string';

const logger = Logger.get('video:vimeo');

const VIMEO_EVENTS_TO_HTML5 = {
	play: 'playing',
	pause: 'pause',
	finish: 'ended',
	seek: 'seeked',
	playProgress: 'timeupdate'
};

const VIMEO_URL_PARTS = /(?:https?:)?\/\/(?:(?:www|player)\.)?vimeo.com\/(?:(?:channels|video)\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?|#)/i;
const VIMEO_PROTOCOL_PARTS = /vimeo:\/\/(\d+\/)?(\d+)/i;

let Source = React.createClass({
	displayName: 'Vimeo-Video',


	statics: {
		service: 'vimeo',
		getID (url) {
			/** @see test */

			const getFromCustomProtocol = x => x.match(VIMEO_PROTOCOL_PARTS);
			const getFromURL = x => x.match(VIMEO_URL_PARTS);

			const [/*matchedURL*/, /*albumId*/, id] = getFromCustomProtocol(url) || getFromURL(url) || [];
			return id || null;
		},

		getCanonicalURL (url) {
			const id = this.getID(url);
			return `https://www.vimeo.com/${id}`;
		}
	},


	propTypes: {
		source: React.PropTypes.any.isRequired,
		autoPlay: React.PropTypes.bool
	},

	attachRef (x) { this.iframe = x; },

	getInitialState () {
		return {};
	},


	componentWillMount () {
		const id = uuid.v4();
		this.setState({id});
		this.updateURL(this.props, id);
	},


	componentDidMount () {
		MESSAGES.add(this.onMessage);
	},


	componentWillReceiveProps (nextProps) {
		this.updateURL(nextProps);
	},


	componentWillUnmount () {
		MESSAGES.remove(this.onMessage);
	},


	buildURL (props, id = this.state.id) {
		const {source: mediaSource, autoPlay} = props;

		let videoId = typeof mediaSource === 'string' ? Source.getID(mediaSource) : mediaSource.source;

		if (Array.isArray(videoId)) {
			videoId = videoId[0];
		}

		if (!id) {
			logger.error('Player ID missing');
		}

		const args = {
			api: 1,
			player_id: id,//eslint-disable-line camelcase
			//autopause: 0, //we handle this for other videos, but its nice we only have to do this for cross-provider videos.
			autoplay: autoPlay ? 1 : 0,
			badge: 0,
			byline: 0,
			loop: 0,
			portrait: 0,
			title: 0
		};

		return 'https://player.vimeo.com/video/' + videoId + '?' + QueryString.stringify(args);
	},


	updateURL (props, id) {
		const url = this.buildURL(props, id);
		this.setState({
			scope: url.split('?')[0],
			playerURL: url
		});
	},


	getPlayerContext () {
		const {iframe} = this;
		return iframe && (iframe.contentWindow || window.frames[iframe.name]);
	},


	onMessage (event) {
		const getData = x => typeof x === 'string' ? JSON.parse(x) : x;
		let data = getData(event.data);
		let mappedEvent = VIMEO_EVENTS_TO_HTML5[data.event];
		let handlerName = EventHandlers[mappedEvent];

		event = data.event;

		if (data.player_id !== this.state.id) {
			return;
		}

		logger.debug('Vimeo Event: %s: %o', event, data.data || data);

		data = data.data;

		if (event === 'error') {
			//console.warn(`Vimeo Error: ${data.code}: ${data.message}`);
			//Make the view just hide the poster so the viewer can tap the embeded player's play button.
			mappedEvent = 'playing';
			handlerName = EventHandlers.playing;
		}
		else if (event === 'ready') {
			this.postMessage('addEventListener', 'play');	//playing
			this.postMessage('addEventListener', 'pause');	//pause
			this.postMessage('addEventListener', 'finish');	//ended
			this.postMessage('addEventListener', 'seek');	//seeked
			this.postMessage('addEventListener', 'playProgress'); //timeupdate
			// this.flushQueue();
		}

		if(mappedEvent && handlerName) {

			this.props[handlerName]({
				timeStamp: Date.now(),
				target: {
					currentTime: data && data.seconds,
					duration: data && data.duration
				},
				type: mappedEvent
			});

		}
	},


	postMessage (method, params) {
		let context = this.getPlayerContext(), data;
		if (!context) {
			logger.warn(this.state.id, ' No Player Context!');
			return;
		}

		data = {
			method: method,
			value: params
		};

		context.postMessage(JSON.stringify(data), this.state.scope);
	},


	render () {

		if (!this.state.playerURL) {
			return (<div>No source</div>);
		}

		let {id} = this.state;

		let props = Object.assign({}, this.props, {
			deferred: null,
			name: id
		});

		return (
			<iframe ref={this.attachRef} {...props} src={this.state.playerURL}
				frameBorder="0" seemless allowFullScreen allowTransparency />
		);
	},


	play () {
		//ready?
		this.postMessage('play');
		//else queue.
	},


	pause () {
		this.postMessage('pause');
	},


	stop () {
		this.postMessage('stop');
	},


	setCurrentTime (time) {
		this.postMessage('seekTo', time);
	}
});

export default Source;
