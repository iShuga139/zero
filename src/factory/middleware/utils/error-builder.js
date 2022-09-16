const fieldsError = {
  400: { name: "RequestError", message: "Bad Request" },
  401: { name: "AuthenticationError", message: "Unauthorized" },
  403: { name: "AuthenticationError", message: "Forbidden" },
  404: { name: "ServiceError", message: "Not Found" },
  421: { name: "ServiceError", message: "Misdirected Request" },
  500: { name: "InternalServerError", message: "Internal Server Error" },
  501: { name: "InternalServerError", message: "Not Implemented" },
  502: { name: "ExternalServerError", message: "Bad Gateway" },
  503: { name: "ExternalServerError", message: "Service Unavailable" },
  504: { name: "ExternalServerError", message: "Gateway Timeout" }
};

/**
 * Creates standard payload errors
 *
 * @param code    HTTP to use
 * @param payload Error(s) to attach into the response
 *
 * @return        Standard object as an error
 */
export default (code, payload) => {
  const errors = Array.isArray(payload) ? payload : [payload];
  const errorCount = errors.length;
  const fields = fieldsError[code];

  const error = { code, ...fields, errors, errorCount };
  return { error };
};
