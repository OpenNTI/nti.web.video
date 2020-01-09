import {getHandler, getUrl, createMediaSourceFromUrl, getCanonicalUrlFrom} from './services';
import Editor, {EmbedInput} from './editor';
import ComponentRaw from './Video';
import Chooser from './video-resources';
import Component from './VideoWithAnalytics';
import Placeholder from './Placeholder';
import {UNSTARTED, ENDED, PLAYING, PAUSED, BUFFERING, CUED} from './Constants';
import Poster from './Poster';

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
