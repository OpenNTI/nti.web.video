import {getHandler, getUrl, createMediaSourceFromUrl, getCanonicalUrlFrom} from './services';
import Editor, {EmbedInput} from './editor';
import ComponentRaw from './Video';
import Chooser from './video-resources';
import Component from './VideoWithAnalytics';
import Placeholder from './Placeholder';
import Poster from './Poster';
import {UNSTARTED, ENDED, PLAYING, PAUSED, BUFFERING, CUED} from './Constants';

export default ComponentRaw;

export {
	getHandler,
	getUrl,
	createMediaSourceFromUrl,
	getCanonicalUrlFrom,
	Component,
	Placeholder,
	Poster,
	Editor,
	EmbedInput,
	Chooser,
	UNSTARTED,
	ENDED,
	PLAYING,
	PAUSED,
	BUFFERING,
	CUED
};
