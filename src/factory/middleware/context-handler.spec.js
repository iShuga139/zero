import express from "express";
import request from "supertest";

import contextHandler from "./context-handler.js";

let app;
const config = { host: "HOST", secret: "good-secret-key" };

describe("Context Handler", () => {
  before(() => {
    app = express()
      .use((req, res, next) => contextHandler(config, req, res, next))
      .get("/something", (req, res) => res.status(200).json(req.context));
  });

  it("should inject a context into Express Request", () => request(app).get("/something").expect(200, config));
});
