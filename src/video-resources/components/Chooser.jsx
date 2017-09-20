import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Prompt, DialogButtons} from 'nti-web-commons';
// import {Models} from 'nti-lib-interfaces';
import cx from 'classnames';

import Browser from './Browser';

const { modal } = Prompt;

class Chooser extends Component {
	static propTypes = {
		videos: PropTypes.array.isRequired,
		course: PropTypes.func.isRequired,
		onCancel: PropTypes.func,
		onDismiss: PropTypes.func,
		onSelect: PropTypes.func,
	}

	state = {
		isEditing: false,
		videos: null
	};

	static show (course, config) {
		return new Promise((select, reject) => {
			modal(
				<Chooser
					course={course}
					onSelect={select}
					onCancel={reject}
				/>,
				{...config, className: 'video-resource-chooser-dialog'}
			);
		});
	}

	componentWillMount () {
		const { course } = this.props;
		course.getAssets('application/vnd.nextthought.ntivideo')
			.then(videos => {
				this.setState({
					videos
				});
			});
	}

	componentWillUnmount () {
		if (this.unmountCallback) {
			this.unmountCallback();
		}
	}

	dismiss () {
		const {onDismiss} = this.props;
		if (onDismiss) {
			onDismiss();
		}
	}

	onCancel = (e) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		const {onCancel} = this.props;

		//Use this call back to wait until the Chooser has been closed
		this.unmountCallback = () => {
			if (onCancel) {
				onCancel();
			}
		};

		this.dismiss();
	}

	onSelect = (e) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		const {props: {onSelect}, state: {selected}} = this;

		if (!selected) { return; }

		//Use this call back to wait until the Chooser has been closed
		this.unmountCallback = () => {
			if (onSelect) {
				onSelect(selected);
			}
		};

		this.dismiss();
		return true;
	}

	selectVideo = (selected) => {
		this.setState({
			selected
		});
	}

	setEditing = (isEditing) => {
		this.setState({
			isEditing
		});
	}

	onEdit = (video) => {
		const { videos } = this.state;
		const newVideos = videos.slice();
		const found = videos.findIndex(v => v.getID() === video.getID());

		if (found > -1) {
			newVideos[found] = video;
		} else {
			newVideos.unshift(video);
		}

		this.setState({
			videos: newVideos,
			isEditing: false
		});
	}

	onDelete = (video) => {
		Prompt.areYouSure('').then(() => {
			this.doDelete(video);
		});
	}

	doDelete = (video) => {
		video.delete()
			.then(() => {
				const { videos } = this.state;
				const newVideos = videos.slice();
				const videoIndex = videos.findIndex(v => v.getID() === video.getID());
				newVideos.splice(videoIndex, 1);
				this.setState({
					videos: newVideos,
					selected: false
				});
			})
			.catch(error => {
				console.error(error); //eslint-disable-line
			});
	}

	render () {
		const { course } = this.props;
		const { isEditing, videos } = this.state;

		const buttons = [
			{
				label: 'Cancel',
				className: 'cancel',
				onClick: this.onCancel
			},
			{
				className: cx({disabled: false}),
				label: 'Select',
				onClick: this.onSelect
			}
		];
		return (
			<div className="video-resource-chooser">
				<Browser
					videos={videos}
					course={course}
					onEdit={this.onEdit}
					onDelete={this.onDelete}
					onClose={this.onCancel}
					onSelect={this.selectVideo}
					setEditing={this.setEditing}
				/>
				{!isEditing && <DialogButtons buttons={buttons} />}
			</div>
		);
	}
}

Chooser.propTypes = {};

export default Chooser;
