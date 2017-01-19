import React from 'react';

import Logger from 'nti-util-logger';
import {getModel} from 'nti-lib-interfaces';
import {getHandler} from './services';

import {getService} from 'nti-web-client';

import Video from './Video';

const logger = Logger.get('video:components:VideoPlaceholder');
const Source = getModel('mediasource');


export default React.createClass({
	displayName: 'VideoPlaceholder',

	propTypes: {
		src: React.PropTypes.string
	},

	getInitialState () {
		return {};
	},


	componentWillMount () {
		this.setHandler(this.props);
	},

	componentWillReceiveProps (props) {
		if (this.props.src !== props.src) {
			this.setHandler(props);
		}
	},


	setHandler (props) {
		const {src} = props;
		const handler = getHandler(src);
		const {service: videoService} = handler || {};
		const videoId = handler && handler.getID && handler.getID(src);

		this.replaceState({handler, videoId, loading: true});

		getService()
			.then(service => new Source(service, null, {service: videoService, source: videoId}))
			.then(source => Promise.all([
				source.getPoster().catch(()=> void 0),
				source.getTitle().catch(()=> void 0)
			]))
			.then(data => {
				const [poster, title] = data;
				this.setState({poster, title});
			})
			.catch(error => logger.error('Could not resolve video poster/title', error))
			.then(()=> this.setState({loading: false}));
	},


	onClick () {
		this.setState({play: true});
	},

	render () {
		const {state: {loading, play, poster, title}} = this;

		const posterRule = poster && {backgroundImage: `url(${poster})`};

		return play ? (
			<Video {...this.props} autoPlay/>
		) : loading ? (
			<div className="video-placeholder" onClick={this.onClick}/>
		) : (
			<div className="video-placeholder content-video video-wrap flex-video widescreen" onClick={this.onClick}>
				<div className="content-video-tap-area" style={posterRule}>
					<div className="wrapper">
						<div className="buttons">
							<span className="play" title="Play"/>
							{!!title && ( <span className="label" title={title}>{title}</span> )}
						</div>
					</div>
				</div>
			</div>
		);
	}
});
