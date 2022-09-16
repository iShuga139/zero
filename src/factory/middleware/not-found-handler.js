import BuildError from "./utils/error-builder.js";

const notFoundCode = 404;

/**
 * Returns an HTTP Express Response with 404 base code when invoked resource is not present
 *
 * @param _req Express Request
 * @param res  Express Response
 *
 * @returns    Express Response
 */
export default (_req, res) =>
  res.status(notFoundCode).json(BuildError(notFoundCode, { message: "Resource not found" }));
