/**
 * Creates a context namespace to encapsulate metadata
 * for the Express Request and Express Response.
 *
 * @param config Object to attach into the request
 * @param req    Express Request
 * @param _res   Express Response
 * @param next   Express NextFunction
 *
 * @returns     Express NextFunction
 */
export default (config, req, _res, next) => {
  req.context = { ...config };

  return next();
};
