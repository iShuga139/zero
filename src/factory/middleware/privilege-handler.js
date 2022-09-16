import BuildError from "./utils/error-builder.js";

const forbiddenCode = 403;
const notImplementedCode = 501;

/**
 * Recursive function to identify if the user has permission
 * to reach the endpoint.
 *
 * @param localUseCases Arrays of local use cases required by the endpoint
 * @param useCases      Arrays of use cases given by JWT
 * @param index         Started point to iterate the use cases
 *
 * @returns             Whether has access to the endpoint or not.
 */
const validateUseCases = (localUseCases, useCases, index) => {
  const exists = useCases.includes(localUseCases[index].toLowerCase());
  index--;

  if (exists && index > -1) {
    return validateUseCases(localUseCases, useCases, index);
  }

  return exists;
};

/**
 * Validates if the current request has access to the resource.
 *
 * @param localUseCases Array of use cases that allow access to the request
 * @param req           Express Request
 * @param res           Express Response
 * @param next          Express NextFunction
 *
 * @returns             Express NextFunction || HTTP 403 Express Response
 */
export default (localUseCases, req, res, next) => {
  if (!localUseCases.length) {
    return res.status(notImplementedCode).json(
      BuildError(notImplementedCode, {
        message: "Unable to identify use cases"
      })
    );
  }

  const { useCases } = req.context.identity;
  const isValid = validateUseCases(localUseCases, useCases, localUseCases.length - 1);
  if (isValid) {
    return next();
  }

  return res.status(forbiddenCode).json(BuildError(forbiddenCode, { message: "Access not granted" }));
};
