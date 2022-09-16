import { expect } from "chai";
import express from "express";
import request from "supertest";

import contextHandler from "./context-handler.js";
import correlationHandler from "./correlation-handler.js";

let app;
const correlationHeader = "x-correlation-id";
const config = { host: "HOST", secret: "good-secret-key" };
const expectedResponse = { ...config };
expectedResponse[correlationHeader] = "some-uuid";

describe("Correlation Handler", () => {
  before(() => {
    app = express()
      .use((req, res, next) => contextHandler(config, req, res, next))
      .use(correlationHandler)
      .get("/something", (req, res) => res.status(200).json(req.context));
  });

  it("should attach request correlation uuid to response", () =>
    request(app)
      .get("/something")
      .set(correlationHeader, expectedResponse[correlationHeader])
      .expect(200, expectedResponse)
      .expect(({ headers }) => {
        expect(headers).haveOwnProperty(correlationHeader);
        expect(headers[correlationHeader]).to.eq("some-uuid");
      }));

  it("should create correlation uuid for request and response", () =>
    request(app)
      .get("/something")
      .expect(200)
      .expect(({ headers }) => {
        expect(headers).haveOwnProperty(correlationHeader);
        expect(headers[correlationHeader]).to.not.be.undefined;
      }));
});
