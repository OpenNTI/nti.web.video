import React from 'react';
import ReactDOM from 'react-dom';
import {getService} from 'nti-web-client';
// import {decodeFromURI} from 'nti-lib-ntiids';

import Video, {Chooser} from '../../src';
import 'nti-style-common/all.scss';
import 'nti-web-commons/lib/index.css';

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
		return (<button onClick={this.onClick}>Show Chooser</button>);
	}
}

ReactDOM.render(
	React.createElement(Test),
	document.getElementById('chooser')
);

ReactDOM.render(
	React.createElement(Video, {src: 'https://youtu.be/ip4z4k4jcRo'}),
	document.getElementById('youtube')
);

ReactDOM.render(
	React.createElement(Video, {src: 'https://vimeo.com/137531269'}),
	document.getElementById('vimeo')
);

ReactDOM.render(
	React.createElement(Video, {src: 'kaltura://1500101/0_nmii7y4j/'}),
	document.getElementById('kaltura')
);
