import { expect } from "chai";
import express from "express";
import request from "supertest";
import { readFileSync } from "fs";

import Router from "./router.js";
import errorHandler from "./middleware/error-handler.js";
import contextHandler from "./middleware/context-handler.js";
import BuildError from "./middleware/utils/error-builder.js";
import BuildResponse from "./middleware/utils/response-builder.js";
import correlationHandler from "./middleware/correlation-handler.js";

let app;
const router = Router();
const nameApp = "test-app";
const useCases = ["test-use-case"];
const organization = { id: "randomUUID", name: "eneco" };
const config = { host: "HOST", identity: { useCases }, skipEndpoints: [] };
const matchUUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const apiManyResponse = correlationId =>
  BuildResponse([{ message: "OK" }, { message: "OK" }, { correlationId, organization }]);

const expectedResponse = {
  data: { items: [{ message: "OK" }], totalItems: 1 }
};
const expectedError = {
  error: {
    code: 500,
    name: "InternalServerError",
    message: "Internal Server Error",
    errors: [{ message: "Something happened" }],
    errorCount: 1
  }
};

describe("Router", () => {
  before(() => {
    const apiResponse = BuildResponse({ message: "OK" });
    const apiError = BuildError(500, { message: "Something happened" });

    router.addGet("/error", () => apiError, useCases);
    router.addPut("/something", () => apiResponse, useCases);
    router.addPatch("/something", () => apiResponse, useCases);
    router.addGet("/something", () => apiResponse, useCases);
    router.addPost("/something", () => apiResponse, useCases);
    router.addDelete("/something", () => apiResponse, useCases);
    router.addGet("/all-something", ({ correlationId }) => apiManyResponse(correlationId), useCases);

    app = express()
      .use((req, res, next) => contextHandler(config, req, res, next))
      .use(correlationHandler)
      .use("/test", router.build(nameApp))
      .use(errorHandler);
  });

  it("should be able to execute HEALTH calls", () =>
    request(app)
      .get("/test/health")
      .expect(200, {
        data: {
          items: [{ message: `Service ${nameApp.toUpperCase()} is running`, version, dependencies: {} }],
          totalItems: 1
        }
      }));

  it("should be able to execute GET calls", () => request(app).get("/test/something").expect(200, expectedResponse));

  it("should be able to execute POST calls", () => request(app).post("/test/something").expect(201, expectedResponse));

  it("should be able to execute PUT calls", () => request(app).put("/test/something").expect(200, expectedResponse));

  it("should be able to execute PATCH calls", () =>
    request(app).patch("/test/something").expect(200, expectedResponse));

  it("should be able to execute DELETE calls", () => request(app).delete("/test/something").expect(204, {}));

  it("should be able to return an error", () => request(app).get("/test/error").expect(500, expectedError));

  it("should be able to execute GET-ALL calls", () =>
    request(app)
      .get("/test/all-something")
      .expect(200)
      .expect(({ body }) => {
        expect(body).haveOwnProperty("data");
        expect(body.data).haveOwnProperty("totalItems");
        expect(body.data.items[0]).deep.eq({ message: "OK" });
        expect(body.data.items[1]).deep.eq({ message: "OK" });
        expect(body.data.items[2].organization).deep.eq(organization);
        expect(body.data.items[2].correlationId).to.match(matchUUID);
        expect(body.data.totalItems).to.eq(3);
      }));
});
