import nock from "nock";
import { expect } from "chai";
import HTTPClient from "./http-client.js";

describe("HTTP Client", () => {
  const internalResponse = { data: { items: [], totalItems: 0 } };
  const externalResponse = { message: "User not found" };
  const externalBody = { userName: "test" };

  before(() => {
    nock("http://internal:8080").get("/internal").reply(200, internalResponse);

    nock("https://localhost:9090/external").post("/not-internal", externalBody).reply(404, externalResponse);
  });

  after(() => nock.cleanAll());

  it("should return an empty object", async () => {
    const { data } = await HTTPClient.do("get", "/internal", { authToken: "token", service: "internal" });
    expect(data).to.deep.eq(internalResponse);
  });

  it("should return an HTTP error", async () => {
    try {
      await HTTPClient.do("post", "https://localhost:9090/external/not-internal", {
        body: externalBody,
        isInternal: false
      });
    } catch ({ response }) {
      const { status, data } = response;
      expect(status).to.eq(404);
      expect(data).to.deep.eq(externalResponse);
    }
  });
});
