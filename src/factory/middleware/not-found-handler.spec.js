import express from "express";
import request from "supertest";

import notFoundHandler from "./not-found-handler.js";

let app;
const expectedError = {
  error: {
    code: 404,
    name: "ServiceError",
    message: "Not Found",
    errors: [{ message: "Resource not found" }],
    errorCount: 1
  }
};

describe("Not Found", () => {
  before(() => {
    app = express().use(notFoundHandler);
  });

  it("should return a handle error", () =>
    request(app).get("/something").set("Accept", "application/json").expect(404, expectedError));
});
