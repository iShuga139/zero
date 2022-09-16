import { expect } from "chai";
import BuildError from "./error-builder.js";

describe("Error Builder", () => {
  it("should return a HTTP 400 error", () => {
    const expectedError = {
      error: {
        code: 400,
        name: "RequestError",
        message: "Bad Request",
        errors: [
          { message: "UUID is missing", level: "Request validation" },
          { message: "Invalid service type", level: "Request validation" }
        ],
        errorCount: 2
      }
    };

    const error = BuildError(400, [
      { message: "UUID is missing", level: "Request validation" },
      { message: "Invalid service type", level: "Request validation" }
    ]);
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 401 error", () => {
    const expectedError = {
      error: {
        code: 401,
        name: "AuthenticationError",
        message: "Unauthorized",
        errors: [{ message: "Invalid token" }],
        errorCount: 1
      }
    };

    const error = BuildError(401, { message: "Invalid token" });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 403 error", () => {
    const expectedError = {
      error: {
        code: 403,
        name: "AuthenticationError",
        message: "Forbidden",
        errors: [{ message: "Access denied" }],
        errorCount: 1
      }
    };

    const error = BuildError(403, { message: "Access denied" });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 404 error", () => {
    const expectedError = {
      error: {
        code: 404,
        name: "ServiceError",
        message: "Not Found",
        errors: [{ message: "Model by UUID not found" }],
        errorCount: 1
      }
    };

    const error = BuildError(404, { message: "Model by UUID not found" });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 421 error", () => {
    const expectedError = {
      error: {
        code: 421,
        name: "ServiceError",
        message: "Misdirected Request",
        errors: [{ message: "ServiceDependency: Resource not found by UUID" }],
        errorCount: 1
      }
    };

    const error = BuildError(421, {
      message: "ServiceDependency: Resource not found by UUID"
    });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 500 error", () => {
    const expectedError = {
      error: {
        code: 500,
        name: "InternalServerError",
        message: "Internal Server Error",
        errors: [{ message: "Something bad happened" }],
        errorCount: 1
      }
    };

    const error = BuildError(500, { message: "Something bad happened" });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 501 error", () => {
    const expectedError = {
      error: {
        code: 501,
        name: "InternalServerError",
        message: "Not Implemented",
        errors: [{ message: "Unable to identify use cases" }],
        errorCount: 1
      }
    };

    const error = BuildError(501, {
      message: "Unable to identify use cases"
    });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 502 error", () => {
    const expectedError = {
      error: {
        code: 502,
        name: "ExternalServerError",
        message: "Bad Gateway",
        errors: [{ message: "Invalid response from ServiceDependency" }],
        errorCount: 1
      }
    };

    const error = BuildError(502, {
      message: "Invalid response from ServiceDependency"
    });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 503 error", () => {
    const expectedError = {
      error: {
        code: 503,
        name: "ExternalServerError",
        message: "Service Unavailable",
        errors: [{ message: "No response from ServiceDependency" }],
        errorCount: 1
      }
    };

    const error = BuildError(503, {
      message: "No response from ServiceDependency"
    });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a HTTP 504 error", () => {
    const expectedError = {
      error: {
        code: 504,
        name: "ExternalServerError",
        message: "Gateway Timeout",
        errors: [{ message: "Timeout from ServiceDependency" }],
        errorCount: 1
      }
    };

    const error = BuildError(504, {
      message: "Timeout from ServiceDependency"
    });
    expect(error).to.deep.eq(expectedError);
  });

  it("should return a not mapped HTTP 409 error", () => {
    const expectedError = {
      error: {
        code: 409,
        errors: [{ message: "Conflict" }],
        errorCount: 1
      }
    };

    const error = BuildError(409, { message: "Conflict" });
    expect(error).to.deep.eq(expectedError);
  });
});
