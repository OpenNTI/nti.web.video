import React from 'react';
import {Flyout} from 'nti-web-commons';

import Button from './more/Button';
import Menu from './more/Menu';


export default function VideoMoreControls (props) {
	const trigger = (<Button {...props} />);

	return (
		<div className="video-more-control">
			<Flyout.InlineFlyout trigger={trigger}>
				<Menu {...props} />
			</Flyout.InlineFlyout>
		</div>
	);
}
