export default function createNonRecoverableError (errMsg) {
	const err = new Error(errMsg);

	err.nonRecoverable = true;

	return err;
}
