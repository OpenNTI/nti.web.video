import React from 'react';
import PropTypes from 'prop-types';
import {Flyout} from 'nti-web-commons';

import Button from './more/Button';
import Menu from './more/Menu';

export default class VideoControlMore extends React.Component {
	static propTypes = {
		showing: PropTypes.bool
	}

	attachFlyoutRef = x => this.flyout = x

	componentWillReceiveProps (nextProps) {
		const {showing:isShowing} = this.props;
		const {showing:willShow} = nextProps;

		if (isShowing && !willShow && this.flyout) {
			this.flyout.dismiss();
		}
	}

	render () {
		const trigger = (<Button {...this.props} />);

		return (
			<div className="video-more-control">
				<Flyout.InlineFlyout trigger={trigger} ref={this.attachFlyoutRef}>
					<Menu {...this.props} />
				</Flyout.InlineFlyout>
			</div>
		);
	}
}

