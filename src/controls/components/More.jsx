import './More.scss';
import React from 'react';
import PropTypes from 'prop-types';
import {Flyout} from '@nti/web-commons';

import Button from './more/Button';
import Menu from './more/Menu';

export default class VideoControlMore extends React.Component {
	static propTypes = {
		showing: PropTypes.bool
	}

	flyout = React.createRef()

	componentDidUpdate (prevProps) {
		const {showing:isShowing} = prevProps;
		const {showing:willShow} = this.props;
		const {current: ref} = this.flyout;

		if (isShowing && !willShow && ref) {
			ref.dismiss();
		}
	}

	render () {
		const trigger = (<Button {...this.props} />);

		return (
			<div className="video-more-control">
				<Flyout.InlineFlyout trigger={trigger} ref={this.flyout}>
					<Menu {...this.props} />
				</Flyout.InlineFlyout>
			</div>
		);
	}
}
