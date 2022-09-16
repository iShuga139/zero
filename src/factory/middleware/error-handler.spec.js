import express from "express";
import request from "supertest";

import errorHandler from "./error-handler.js";
import BuildError from "./utils/error-builder.js";

let app;

describe("Error Handler", () => {
  before(() => {
    const apiError = BuildError(404, { message: "Something by Id not found" });
    app = express()
      .get("/error", (_req, _res, next) => next(apiError))
      .use(errorHandler);
  });

  it("should return a handled error", () => {
    const expectedError = {
      error: {
        code: 404,
        name: "ServiceError",
        message: "Not Found",
        errors: [{ message: "Something by Id not found" }],
        errorCount: 1
      }
    };

    return request(app).get("/error").expect(404, expectedError);
  });
});
