import winston from "winston";
import { logger, errorLogger } from "express-winston";

/**
 * Middleware to log HTTP Request when an endpoint is called.
 */
export const routeLoggerHandler = () =>
  logger({
    transports: [new winston.transports.Console()],
    format: winston.format.json(),
    expressFormat: true,
    colorize: false,
    meta: true,
    metaField: null,
    requestField: null,
    responseField: null,
    dynamicMeta: ({ headers, originalUrl, context, method, ips }, res) => {
      const contentLength = res[Object.getOwnPropertySymbols(res)[3]]["content-length"];

      return {
        method,
        url: originalUrl,
        "remote-address": ips,
        "status-code": res.statusCode,
        "content-length": contentLength ? contentLength[1] : 0,
        "user-agent": headers["user-agent"],
        "correlation-id": context["x-correlation-id"],
        "organization-id": context?.identity?.organization?.id || "",
        "enduser-id": context?.identity?.endUser?.id || "",
        "account-id": context?.identity?.sub
      };
    },
    ignoreRoute: req => req.url.slice(-6) === "health" // optional: allows to skip some log messages based on request and/or response
  });

/**
 * Middleware to log errors when Express NextFunction contains an error.
 */
export const errorLoggerHandler = () =>
  errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.json(),
    meta: true,
    requestField: null,
    metaField: null,
    blacklistedMetaFields: ["process", "os", "trace", "exception"],
    dynamicMeta: (req, _res, { error }) => {
      const correlationId = req?.context["x-correlation-id"];

      return { error, "correlation-id": correlationId };
    }
  });

export const contextLogger = (req, _res, next) => {
  const level = req.headers["context-logger"] || "info";
  req.context.logger = winston.createLogger({
    level,
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.json(),
      winston.format.printf(info =>
        JSON.stringify({
          level: info.level,
          message: info.message,
          cause: info.cause,
          "correlation-id": req?.context["x-correlation-id"]
        })
      )
    )
  });

  return next();
};
