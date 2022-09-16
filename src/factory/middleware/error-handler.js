/**
 * Handle an error and return it as HTTP Express Response if present
 * otherwise calls the NextFunction
 *
 * @param errorMessage Error object to handler
 * @param _req         Express Request
 * @param res          Express Response
 * @param next         Express NextFunction
 *
 * @returns       Express NextFunction || Express Response
 */
export default (errorMessage, _req, res, next) => {
  const { error } = errorMessage;
  if (error) {
    return res.status(error.code).json(errorMessage);
  }
  /* c8 ignore next */
  return next();
};
/* Ignored lines for coverage because express handles the calls for `next(error)`
     and requires a lot of effort with mock events on express side to reach this point.
   */
