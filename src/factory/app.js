import cors from "cors";
import helmet from "helmet";
import express from "express";

import errorHandler from "./middleware/error-handler.js";
import authentication from "./middleware/authentication.js";
import contextHandler from "./middleware/context-handler.js";
import notFoundHandler from "./middleware/not-found-handler.js";
import correlationHandler from "./middleware/correlation-handler.js";
import { routeLoggerHandler, errorLoggerHandler, contextLogger } from "./middleware/logger.js";

import { appConfigEnv, contextConfigEnv } from "./config.js";

/**
 * Create an express application to mount routes in a specific context.
 *
 * @param serviceRoutes Routes exposed into the service with specific logic
 * @param port          Port where the service will run
 * @param name          Name of the service, combined with context
 * @param context       Namespace of the service, combined with name
 * @param limit         Maximum size of objects supported in the service
 * @param contextConfig Object to configure the context
 *
 * @return              Void
 */
const initializeApp = (serviceRoutes, { port, name, context, limit }, contextConfig) =>
  express()
    .use(helmet())
    .use(cors())
    .use(express.json({ limit }))
    .use(express.raw({ type: "application/xml" }, { limit }))
    .use(express.text({ limit }))
    .use(express.urlencoded({ extended: true }))
    .use((req, res, next) => contextHandler(contextConfig, req, res, next))
    .use(correlationHandler)
    .use(routeLoggerHandler())
    .use(contextLogger)
    .use((req, res, next) => authentication(`/${name}${context}`, req, res, next))
    .use(`/${name}${context}`, serviceRoutes)
    .use(errorLoggerHandler())
    .use(errorHandler)
    .use(notFoundHandler)
    .enable("trust proxy")
    .disable("etag")
    .listen(port);

export default {
  /**
   * Initialize a Service as an express application
   * mounting the giving routes into the name + context path.
   *
   * @param serviceRoutes Routes exposed into the service with specific logic
   *
   * @return              Express application
   */
  start: serviceRoutes => {
    const contextConfig = contextConfigEnv();
    const appConfig = appConfigEnv();

    if (!serviceRoutes) {
      throw new Error("Route instance is required to initialize the application");
    }

    const routes = serviceRoutes.build(appConfig.name);
    return initializeApp(routes, appConfig, contextConfig);
  }
};
