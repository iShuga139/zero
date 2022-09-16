import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import authentication from "./authentication.js";
import contextHandler from "./context-handler.js";
import privilegeHandler from "./privilege-handler.js";

let app;
let token;
const secret = "good-secret-key";
const useCases = ["getSomething", "respondSomething"];
const config = { secret, host: "HOST", skipEndpoints: [] };

describe("Use Cases Handler", () => {
  before(() => {
    app = express()
      .use((req, res, next) => contextHandler(config, req, res, next))
      .use((req, res, next) => authentication("/zero", req, res, next))
      .get(
        "/with-use-cases",
        (req, res, next) => privilegeHandler(useCases, req, res, next),
        (req, res) => res.status(200).json(req.context)
      )
      .get(
        "/without-use-cases",
        (req, res, next) => privilegeHandler([], req, res, next),
        (req, res) => res.status(200).json(req.context)
      );
  });

  describe("when required use cases", () => {
    it("should provide access to the request and return a valid response", () => {
      const lowerUseCases = useCases.map(useCase => useCase.toLowerCase());
      const expectedResponse = {
        ...config,
        identity: {
          db: { user: "", discriminator: {} },
          contracts: [{ id: "1" }],
          useCases: lowerUseCases,
          organization: {},
          sub: "XXX",
          name: {}
        }
      };
      token = jwt.sign({ sub: "XXX", iss: "Rockman", usecases: lowerUseCases, contracts: [{ id: "1" }] }, secret);

      return request(app).get("/with-use-cases").set("Authorization", `Bearer ${token}`).expect(200, expectedResponse);
    });

    it("should return a Forbidden error when not enough useCases", () => {
      token = jwt.sign({ sub: "XXX", iss: "Rockman" }, secret);
      const expectedError = {
        error: {
          code: 403,
          name: "AuthenticationError",
          message: "Forbidden",
          errorCount: 1,
          errors: [{ message: "Access not granted" }]
        }
      };

      return request(app).get("/with-use-cases").set("Authorization", `Bearer ${token}`).expect(403, expectedError);
    });
  });

  describe("when not required use cases", () => {
    it("should return a not implemented error with valid token", () => {
      token = jwt.sign({ sub: "XXX", iss: "Rockman", usecases: useCases }, secret);
      const expectedError = {
        error: {
          code: 501,
          name: "InternalServerError",
          message: "Not Implemented",
          errors: [{ message: "Unable to identify use cases" }],
          errorCount: 1
        }
      };

      return request(app).get("/without-use-cases").set("Authorization", `Bearer ${token}`).expect(501, expectedError);
    });

    it("should return a not implemented error with invalid token", () => {
      token = jwt.sign({ sub: "XXX", iss: "Rockman" }, secret);
      const expectedError = {
        error: {
          code: 501,
          name: "InternalServerError",
          message: "Not Implemented",
          errors: [{ message: "Unable to identify use cases" }],
          errorCount: 1
        }
      };

      return request(app).get("/without-use-cases").set("Authorization", `Bearer ${token}`).expect(501, expectedError);
    });
  });
});
