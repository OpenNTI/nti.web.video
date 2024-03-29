import './Placeholder.scss';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Logger from '@nti/util-logger';
import { getModel } from '@nti/lib-interfaces';
import { getService } from '@nti/web-client';

import { getHandler } from './services';
import Video from './Video';

const logger = Logger.get('video:components:VideoPlaceholder');
const Source = getModel('mediasource');

export default class VideoPlaceholder extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		src: PropTypes.string,
	};

	state = {};

	componentDidMount() {
		this.setHandler();
	}

	componentDidUpdate({ src }) {
		if (this.props.src !== src) {
			this.setHandler();
		}
	}

	setHandler({ src } = this.props) {
		const handler = getHandler(src);
		const { service: videoService } = handler || {};
		const videoId = handler && handler.getID && handler.getID(src);

		const reset = {};
		Object.keys(this.state).forEach(k => (reset[k] = void k));
		this.setState({ ...reset, handler, videoId, loading: true });

		getService()
			.then(
				service =>
					new Source(service, null, {
						service: videoService,
						source: videoId,
					})
			)
			.then(source =>
				Promise.all([
					source.getPoster().catch(() => void 0),
					source.getTitle().catch(() => void 0),
				])
			)
			.then(data => {
				const [poster, title] = data;
				this.setState({ poster, title });
			})
			.catch(error =>
				logger.error('Could not resolve video poster/title', error)
			)
			.then(() => this.setState({ loading: false }));
	}

	onClick = () => {
		this.setState({ play: true });
	};

	render() {
		const {
			props: { className },
			state: { loading, play, poster, title },
		} = this;

		const posterRule = poster && { backgroundImage: `url(${poster})` };

		return play ? (
			<Video {...this.props} autoPlay />
		) : loading ? (
			<div
				className={cx('video-placeholder', className)}
				onClick={this.onClick}
			/>
		) : (
			<div
				className={cx('video-placeholder', 'nti-video', className)}
				onClick={this.onClick}
			>
				<div className="video-tap-area" style={posterRule}>
					<div className="wrapper">
						<div className="buttons">
							<span className="play" title="Play" />
							{!!title && (
								<span className="label" title={title}>
									{title}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
}
