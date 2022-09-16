import { v4 as uuid } from "uuid";

const correlationHeader = "x-correlation-id";

/**
 * Define a correlation uuid to identify the transaction according headers
 *
 * @param req   Express Request
 * @param res   Express Response
 * @param next  Express NextFunction
 *
 * @returns     Express NextFunction
 */
export default (req, res, next) => {
  const correlation = req.headers[correlationHeader] || uuid();

  req.context[correlationHeader] = correlation;
  res.setHeader(correlationHeader, correlation);
  return next();
};
