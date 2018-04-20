import React, {Fragment} from 'react';
import ReactDOM from 'react-dom';
import {getService} from '@nti/web-client';
// import {decodeFromURI} from '@nti/lib-ntiids';

import Video, {Chooser} from '../../src';
import '@nti/style-common/all.scss';
import '@nti/web-commons/lib/index.css';

window.$AppConfig = window.$AppConfig || {server: '/dataserver2/'};

// const FAKE_VIDEO = {
// 	sources: [
// 		new MediaSource({service: 'youtube', source: ['ip4z4k4jcRo']}),
// 		new MediaSource({service: 'vimeo', source: ['137531269']}),
// 		new MediaSource({service: 'kaltura', source: ['1500101:0_nmii7y4j']})
// 	]
// };


let courseID = localStorage.getItem('course-ntiid');

if (!courseID) {
	courseID = window.prompt('Enter Course NTIID');
	localStorage.setItem('course-ntiid', courseID);
}

class Test extends React.Component {

	onClick = async () => {
		const service = await getService();
		const course = await service.getObject(courseID);

		Chooser.show(course);
	}

	render () {
		return (
			<Fragment>

				<button onClick={this.onClick}>Show Chooser</button>

				<div style={{maxWidth: 500, margin: 15}}>
					<h3>html5/Kaltura</h3>
					<Video src="kaltura://1500101/0_nmii7y4j/"/>

					<h3>YouTube</h3>
					<Video src="https://youtu.be/ip4z4k4jcRo"/>

					<h3>Vimeo</h3>
					<Video src="https://vimeo.com/137531269"/>
				</div>
			</Fragment>
		);
	}
}



ReactDOM.render(
	React.createElement(Test),
	document.getElementById('content')
);
