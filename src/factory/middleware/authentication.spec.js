import { expect } from "chai";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { contextLogger } from "./logger.js";
import authentication from "./authentication.js";
import contextHandler from "./context-handler.js";

let app;
const secret = "good-secret-key";
const config = {
  secret,
  name: "zero",
  discriminatorKey: "contractId",
  discriminatorClaim: "contracts",
  skipEndpoints: ["/health", "/login", "/reset-password"]
};

describe("Authentication", () => {
  const validateError = (error, errors) => {
    expect(error).haveOwnProperty("code");
    expect(error).haveOwnProperty("name");
    expect(error).haveOwnProperty("message");
    expect(error).haveOwnProperty("errorCount");

    expect(error.code).to.eq(401);
    expect(error.name).to.eq("AuthenticationError");
    expect(error.message).to.eq("Unauthorized");
    expect(error.errorCount).to.eq(1);
    expect(error.errors).to.deep.eq(errors);
  };

  before(() => {
    app = express()
      .use((req, res, next) => contextHandler(config, req, res, next))
      .use(contextLogger)
      .use((req, res, next) => authentication(`/zero`, req, res, next))
      .get("/zero/something", (req, res) => res.status(200).json(req.context.identity))
      .get("/zero/health", (_req, res) => res.status(200).json({ message: "Service is running" }))
      .get("/zero/login", (_req, res) => res.status(200).json({ message: "Logged in" }));
  });

  it("should ignore authentication when health endpoint is called", () => {
    const expectedResponse = { message: "Service is running" };

    return request(app).get("/zero/health").expect(200, expectedResponse);
  });

  it("should ignore authentication when skipped endpoint is called", () => {
    const expectedResponse = { message: "Logged in" };

    return request(app).get("/zero/login").expect(200, expectedResponse);
  });

  it("should ignore authentication when skipped endpoint is called and includes query params", () => {
    const expectedResponse = { message: "Logged in" };

    return request(app).get("/zero/login?zero=awesome").expect(200, expectedResponse);
  });

  it("should accept request with organization and useCases defaults", () => {
    const contracts = [{ id: "1" }];
    const token = jwt.sign(
      {
        contracts,
        sub: "XXX",
        iss: "Rockman",
        scopes: ["enduser"],
        name: { first: "User", last: "Test" },
        organization: { id: "123456", name: "Test" }
      },
      secret
    );

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(200, {
        db: { dbName: "123456", user: "User Test", discriminator: { key: "contractId", values: contracts } },
        organization: { id: "123456", name: "Test" },
        name: { first: "User", last: "Test" },
        scopes: ["enduser"],
        useCases: [],
        sub: "XXX",
        contracts
      });
  });

  it("should accept request with full identity properties", () => {
    const endUser = { id: "userId", name: "userName" };
    const tokenProps = {
      role: ["tester"],
      scopes: ["client"],
      name: { first: "Test", last: "Token" },
      contracts: ["contractOne", "contractTwo"]
    };
    const token = jwt.sign({ sub: "XXX", iss: "Rockman", ...tokenProps, ...{ enduser: endUser } }, secret);

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(200, {
        db: { discriminator: {}, user: "Test Token" },
        name: { first: "Test", last: "Token" },
        organization: {},
        useCases: [],
        sub: "XXX",
        ...tokenProps,
        endUser
      });
  });

  it("should reject request due to 'Authentication is missing'", () =>
    request(app)
      .get("/zero/something")
      .expect(({ body }) => validateError(body.error, [{ message: "Authentication is missing" }]))
      .expect(401));

  it("should reject request due to 'Token type not supported'", () =>
    request(app)
      .get("/zero/something")
      .set("Authorization", "token")
      .expect(({ body }) => validateError(body.error, [{ message: "Token type not supported" }]))
      .expect(401));

  it("should reject request due to 'Token is missing'", () =>
    request(app)
      .get("/zero/something")
      .set("Authorization", "Bearer")
      .expect(({ body }) => validateError(body.error, [{ message: "Token is missing" }]))
      .expect(401));

  it("should reject request due to 'jwt malformed'", () =>
    request(app)
      .get("/zero/something")
      .set("Authorization", "Bearer token123")
      .expect(({ body }) =>
        validateError(body.error, [
          {
            message: "Invalid token",
            cause: { name: "JsonWebTokenError", message: "jwt malformed" }
          }
        ])
      )
      .expect(401));

  it("should reject request due to 'invalid signature'", () => {
    const token = jwt.sign({ something: "something" }, "wrong-secret-key");

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(({ body }) =>
        validateError(body.error, [
          {
            message: "Invalid token",
            cause: { name: "JsonWebTokenError", message: "invalid signature" }
          }
        ])
      )
      .expect(401);
  });

  it("should reject request due to 'Untrusted token'", () => {
    const token = jwt.sign({ something: "something" }, secret);

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(({ body }) => validateError(body.error, [{ message: "Untrusted token" }]))
      .expect(401);
  });

  it("should reject request due to 'Untrusted token' for issuer", () => {
    const token = jwt.sign({ iss: "No-Zero" }, secret);

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(({ body }) => validateError(body.error, [{ message: "Untrusted token" }]))
      .expect(401);
  });

  it("should reject request due to 'Untrusted token' for sub", () => {
    const token = jwt.sign({ sub: "XXX" }, secret);

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(401)
      .expect(({ body }) => validateError(body.error, [{ message: "Untrusted token" }]));
  });

  it("should reject request due to 'Secret is missing'", () => {
    app = express()
      .use((req, res, next) => contextHandler({ skipEndpoints: [] }, req, res, next))
      .use(contextLogger)
      .use((req, res, next) => authentication("/zero", req, res, next))
      .get("/zero/something", (req, res) => res.status(200).json(req.context));

    const token = jwt.sign({ sub: "XXX" }, secret);

    return request(app)
      .get("/zero/something")
      .set("Authorization", `Bearer ${token}`)
      .expect(500)
      .expect(({ body }) => {
        const { error } = body;
        expect(error).haveOwnProperty("code");
        expect(error).haveOwnProperty("name");
        expect(error).haveOwnProperty("message");
        expect(error).haveOwnProperty("errorCount");

        expect(error.code).to.eq(500);
        expect(error.name).to.eq("InternalServerError");
        expect(error.message).to.eq("Internal Server Error");
        expect(error.errorCount).to.eq(1);
        expect(error.errors).deep.eq([{ message: "Secret is missing" }]);
      });
  });
});
