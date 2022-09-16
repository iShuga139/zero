import { expect } from "chai";
import jwt from "jsonwebtoken";
import request from "supertest";
import { readFileSync } from "fs";

import Service from "./app.js";
import Router from "./router.js";
import BuildError from "./middleware/utils/error-builder.js";
import BuildResponse from "./middleware/utils/response-builder.js";

let app;
const privileges = ["test-use-case"];
const dependencies = { mongoDB: "Running", redis: "Running" };
const router = Router(() => dependencies);
const correlationKey = "x-correlation-id";
const expectedResponse = { data: { items: [{ message: "OK" }], totalItems: 1 } };
const matchUUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const token = jwt.sign(
  {
    sub: "XXX",
    iss: "Rockman",
    usecases: ["test-use-case", "error-use-case"],
    organization: { id: "123456", name: "Test" },
    name: { first: "User", last: "Test" },
    contracts: [{ id: "1" }],
    enduser: { id: "123" }
  },
  "super-secret"
);

describe("Application", () => {
  before(async () => {
    process.env.SERVICE_SKIP_ENDPOINTS = "/login,/reset-password";
    process.env.DISCRIMINATOR_KEY = "enduserId";
    process.env.DISCRIMINATOR_CLAIM = "enduser";

    const apiResponse = BuildResponse({ message: "OK" });
    const apiError = BuildError(500, { message: "Ops!!!" });

    router.addGet(
      "/something",
      ({ logger }) => {
        logger.info("Printing INFO...");
        logger.debug("Printing DEBUG...");

        return apiResponse;
      },
      privileges
    );
    router.addGet("/error", () => apiError, ["error-use-case"]);
    router.addGet("/use-case-error", () => apiError);
    router.addPost(
      "/something-else",
      ({ body }) => {
        return BuildResponse({ body: body.toString() });
      },
      privileges
    );
    router.addDelete("/non-content-length", () => apiResponse, privileges);
    router.addPost("/login", () => apiResponse);
  });

  describe("without Routes instance", () => {
    it("should raise an error when routes instance is not present", () => {
      try {
        Service.start();
      } catch ({ message }) {
        expect(message).to.eq("Route instance is required to initialize the application");
      }
    });
  });

  describe("with Routes instance", () => {
    before(async () => {
      app = await Service.start(router);
    });

    after(() => app.close());

    it("should return a health response", () =>
      request(app)
        .get("/zero/health")
        .expect(({ headers, body, status }) => {
          expect(status).to.eq(200);
          expect(body).deep.eq({
            data: {
              items: [{ message: `Service ZERO is running`, version, dependencies }],
              totalItems: 1
            }
          });
          expect(headers).haveOwnProperty(correlationKey);
          expect(headers[correlationKey]).to.match(matchUUID);
        }));

    it("should return a valid response when privileges are not required", () =>
      request(app)
        .post("/zero/login")
        .expect(({ headers, body, status }) => {
          expect(status).to.eq(201);
          expect(body).deep.eq(expectedResponse);
          expect(headers).haveOwnProperty(correlationKey);
          expect(headers[correlationKey]).to.match(matchUUID);
        }));

    it("should return 401 Unauthorized response", async () => {
      const { headers, body, status } = await request(app).get("/zero/something").set("Context-Logger", "debug");

      const theResponse = BuildError(401, { message: "Authentication is missing" });

      expect(status).to.eq(401);
      expect(body).deep.eq(theResponse);
      expect(headers).haveOwnProperty(correlationKey);
      expect(headers[correlationKey]).to.match(matchUUID);
    });

    it("should return a valid response", async () => {
      const { headers, body, status } = await request(app)
        .get("/zero/something")
        .set("Authorization", `Bearer ${token}`)
        .set("Context-Logger", "debug");

      expect(status).to.eq(200);
      expect(body).deep.eq(expectedResponse);
      expect(headers).haveOwnProperty(correlationKey);
      expect(headers[correlationKey]).to.match(matchUUID);
    });

    it("should support xml body", async () => {
      const xmlBody =
        '<action class="invoke" serviceid="zero">\n' +
        "    <u:request>\n" +
        "        <p1>one</p1>\n" +
        "        <p2>two</p2>\n" +
        "    </u:request>\n" +
        "</action>";

      const { headers, body, status } = await request(app)
        .post("/zero/something-else")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", `application/xml`)
        .set("Context-Logger", "debug")
        .send(xmlBody);

      const theResponse = BuildResponse({ body: xmlBody });

      expect(status).to.eq(201);
      expect(body).deep.eq(theResponse);
      expect(headers).haveOwnProperty(correlationKey);
      expect(headers[correlationKey]).to.match(matchUUID);
    });

    it("should return a HTTP 501 error", async () => {
      const { headers, body, status } = await request(app)
        .get("/zero/use-case-error")
        .set("Authorization", `Bearer ${token}`);
      const expectedError = {
        error: {
          code: 501,
          name: "InternalServerError",
          errors: [{ message: "Unable to identify use cases" }],
          message: "Not Implemented",
          errorCount: 1
        }
      };

      expect(status).to.eq(501);
      expect(body).deep.eq(expectedError);
      expect(headers).haveOwnProperty(correlationKey);
      expect(headers[correlationKey]).to.match(matchUUID);
    });

    it("should return HTTP 500 error", async () => {
      const { headers, body, status } = await request(app).get("/zero/error").set("Authorization", `Bearer ${token}`);
      const expectedError = {
        error: {
          code: 500,
          name: "InternalServerError",
          message: "Internal Server Error",
          errors: [{ message: "Ops!!!" }],
          errorCount: 1
        }
      };

      expect(status).to.eq(500);
      expect(body).deep.eq(expectedError);
      expect(headers).haveOwnProperty(correlationKey);
      expect(headers[correlationKey]).to.match(matchUUID);
    });

    it("should return HTTP 404 error", async () => {
      const notFoundError = {
        error: {
          code: 404,
          name: "ServiceError",
          message: "Not Found",
          errors: [{ message: "Resource not found" }],
          errorCount: 1
        }
      };

      const { headers, body, status } = await request(app)
        .get("/zero/not-found")
        .set("Authorization", `Bearer ${token}`);

      expect(status).to.eq(404);
      expect(body).deep.eq(notFoundError);
      expect(headers).haveOwnProperty(correlationKey);
      expect(headers[correlationKey]).to.match(matchUUID);
    });

    it("should return a valid response without body", async () => {
      const { body, status } = await request(app)
        .delete("/zero/non-content-length")
        .set("Authorization", `Bearer ${token}`);

      expect(status).to.eq(204);
      expect(body).deep.eq({});
    });
  });
});
