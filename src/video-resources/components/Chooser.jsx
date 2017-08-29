import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Prompt, DialogButtons} from 'nti-web-commons';
import {Models} from 'nti-lib-interfaces';
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
		videos: []
	};

	static show (course) {
		return new Promise((select, reject) => {
			modal(
				<Chooser
					course={course}
					onSelect={select}
					onCancel={reject}
				/>,
				'video-resource-chooser-dialog'
			);
		});
	}

	componentWillMount () {
		const { course } = this.props;
		course.getAssets(Models.media.Video.MimeType[1])
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

	getSelectLabel () {
		// TODO: Update the text to the amount of videos selected
		return 'Select';
	}

	onSelectionChanged () {}

	setEditing = (isEditing) => {
		this.setState({
			isEditing
		});
	}

	onEdit = (video) => {
		const { videos } = this.state;
		this.setState({
			videos: videos.map(v => v.getID() === video.getID() ? video : v),
			isEditing: true
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
				label: this.getSelectLabel() || 'Select',
				onClick: this.onSelect
			}
		];
		return (
			<div className="video-resource-chooser">
				<Browser
					videos={videos}
					course={course}
					onEdit={this.onEdit}
					onSelectionChanged={this.onSelectionChanged}
					onClose={this.onCancel}
					setEditing={this.setEditing}
				/>
				{!isEditing && <DialogButtons buttons={buttons} />}
			</div>
		);
	}
}

Chooser.propTypes = {};

export default Chooser;
