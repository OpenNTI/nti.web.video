import {getHandler, getUrl, createMediaSourceFromUrl, getCanonicalUrlFrom} from './services';
import ComponentRaw from './Video';
import Component from './VideoWithAnalytics';
import Placeholder from './Placeholder';

export default ComponentRaw;

export {
	getHandler,
	getUrl,
	createMediaSourceFromUrl,
	getCanonicalUrlFrom,
	Component,
	Placeholder
};
