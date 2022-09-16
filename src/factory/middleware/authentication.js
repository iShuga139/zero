import jwt from "jsonwebtoken";
import BuildError from "./utils/error-builder.js";

const unauthorizedCode = 401;

const errorResponse = (logger, res, body, code = unauthorizedCode) => {
  body?.error?.errors?.forEach(({ message, cause }) => logger.error({ message, cause }));
  return res.status(code).json(body);
};

const verifyAuthorization = authHeader => {
  if (!authHeader) {
    return { error: BuildError(unauthorizedCode, { message: "Authentication is missing" }) };
  }

  const [bearerKey, bearerToken] = authHeader.split(" ");
  if (bearerKey !== "Bearer") {
    return { error: BuildError(unauthorizedCode, { message: "Token type not supported" }) };
  }

  if (!bearerToken) {
    return { error: BuildError(unauthorizedCode, { message: "Token is missing" }) };
  }

  return { bearerToken };
};

const requiresAuthentication = (endpoints, namespace, path) =>
  endpoints?.map(endpoint => `${namespace}${endpoint}`)?.includes(path);

const getDiscriminatorFrom = (key, scopes, discriminatorValues = []) => {
  const isEndUser = scopes?.map(scope => scope.toLowerCase()).includes("enduser");
  const values = Array.isArray(discriminatorValues) ? discriminatorValues : [discriminatorValues];

  return isEndUser ? { key, values } : {};
};

/**
 * Validates whether a request is authorized or not.
 *
 * @param namespace Application namespace where endpoints are mounted
 * @param req       Express Request
 * @param res       Express Response
 * @param next      Express NextFunction
 *
 * @returns Express NextFunction || BuildError(401)
 */
export default (namespace, req, res, next) => {
  const { logger, skipEndpoints, discriminatorKey, discriminatorClaim } = req.context;
  const skipAuthentication = requiresAuthentication(skipEndpoints, namespace, req.path);
  if (skipAuthentication) {
    logger.debug("Skipping authentication");
    return next();
  }

  const authHeader = req.header("Authorization");
  const { error, bearerToken } = verifyAuthorization(authHeader);
  if (error) {
    return errorResponse(logger, res, error);
  }

  const { secret } = req.context;
  if (!secret) {
    return errorResponse(logger, res, BuildError(500, { message: "Secret is missing" }), 500);
  }

  try {
    const claimsFromJWT = jwt.verify(bearerToken, secret);
    const { organization = {}, usecases = [], name = {}, contracts, enduser, scopes, role, sub, iss } = claimsFromJWT;

    const discriminator = getDiscriminatorFrom(discriminatorKey, scopes, claimsFromJWT[discriminatorClaim]);
    if (sub && iss?.toLowerCase() === "rockman") {
      req.context.identity = {
        organization,
        useCases: usecases,
        sub,
        name,
        role,
        scopes,
        endUser: enduser,
        contracts,
        db: {
          discriminator,
          dbName: organization.id,
          user: Object.values(name)
            .filter(n => n)
            .join(" ")
        }
      };
      return next();
    }

    return errorResponse(logger, res, BuildError(unauthorizedCode, { message: "Untrusted token" }));
  } catch (err) {
    return errorResponse(logger, res, BuildError(unauthorizedCode, { message: "Invalid token", cause: err }));
  }
};
