import { Router } from "express";
import { readFileSync } from "fs";

import privilegeHandler from "./middleware/privilege-handler.js";
import BuildResponse from "./middleware/utils/response-builder.js";

/**
 * Creates an express router instance to mount controllers.
 *
 * @param   checkDependencies Function to validate dependencies status
 *
 * @returns object            Manipulate verbs routes.
 */
export default checkDependencies => {
  const healthRoute = "/health";
  const httpCodes = { put: 200, get: 200, post: 201, patch: 200, delete: 204 };
  const useVerb = { PUT: "put", GET: "get", POST: "post", PATCH: "patch", DELETE: "delete" };
  const { version } = JSON.parse(readFileSync("package.json", "utf8"));

  const router = Router({ mergeParams: true });

  const validatePath = (endpoints, path, privileges, req, res, next) =>
    endpoints.includes(path) ? next() : privilegeHandler(privileges, req, res, next);

  /**
   * Maps the expected functionality in a controller as an express route.
   *
   * @param method     Verb to use in the controller coming from routes.useVerb
   * @param path       Path to reach the action in the controller
   * @param action     Functionality to be implemented in the controller
   * @param privileges Array of use cases required for the controller
   *
   * @returns          Void
   */
  const addRoute = (method, path, action, privileges = []) => {
    router[method](
      path,
      (req, res, next) => validatePath(req?.context?.skipEndpoints, path, privileges, req, res, next),
      (req, res, next) => {
        const { query, body, params, headers, context } = req;
        const { identity, logger } = context;
        const correlationId = context["x-correlation-id"];

        return Promise.resolve(action({ body, query, params, headers, identity, correlationId, logger })).then(
          response => {
            if (response?.error) {
              return next(response);
            }

            return res.status(httpCodes[method]).json(response);
          }
        );
      }
    );
  };

  /**
   * Adds a get route to the controller implementing the provider action
   *
   * @param path       Path to map the action with the controller
   * @param action     Action to be implemented
   * @param privileges Use cases to validate access after authentication
   *
   * @returns        Void
   */
  const addGet = (path, action, privileges) => addRoute(useVerb.GET, path, action, privileges);

  /**
   * Adds a put route to the controller implementing the provider action
   *
   * @param path       Path to map the action with the controller
   * @param action     Action to be implemented
   * @param privileges Use cases to validate access after authentication
   *
   * @returns        Void
   */
  const addPut = (path, action, privileges) => addRoute(useVerb.PUT, path, action, privileges);

  /**
   * Adds a patch route to the controller implementing the provider action
   *
   * @param path       Path to map the action with the controller
   * @param action     Action to be implemented
   * @param privileges Use cases to validate access after authentication
   *
   * @returns        Void
   */
  const addPatch = (path, action, privileges) => addRoute(useVerb.PATCH, path, action, privileges);

  /**
   * Adds a post route to the controller implementing the provider action
   *
   * @param path       Path to map the action with the controller
   * @param action     Action to be implemented
   * @param privileges Use cases to validate access after authentication
   *
   * @returns        Void
   */
  const addPost = (path, action, privileges) => addRoute(useVerb.POST, path, action, privileges);

  /**
   * Adds a delete route to the controller implementing the provider action
   *
   * @param path       Path to map the action with the controller
   * @param action     Action to be implemented
   * @param privileges Use cases to validate access after authentication
   *
   * @returns        Void
   */
  const addDelete = (path, action, privileges) => addRoute(useVerb.DELETE, path, action, privileges);

  /**
   * Creates a router to handle routes and implementation into a controller.
   * Is executed internally; no need to call this method
   * if default factory is being used
   *
   * @param name     Name of the service
   *
   * @returns        Instance to mount routes in an express.Application
   */
  const build = name => {
    router.get(healthRoute, async (_req, res) => {
      const dependencies = typeof checkDependencies === "function" ? await checkDependencies() : {};
      return res.status(httpCodes.get).json(
        BuildResponse({
          message: `Service ${name.toUpperCase()} is running`,
          version,
          dependencies
        })
      );
    });

    return router;
  };

  return { addGet, addPut, addPatch, addPost, addDelete, build };
};
