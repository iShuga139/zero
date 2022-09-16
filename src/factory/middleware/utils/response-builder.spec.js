import { expect } from "chai";
import BuildResponse from "./response-builder.js";

describe("Response Builder", () => {
  it("should return items as empty array when payload is an array", () => {
    const expectedResponse = { data: { items: [], totalItems: 0 } };

    const response = BuildResponse([]);
    expect(response).deep.eq(expectedResponse);
  });

  it("should return items as empty array when no payload", () => {
    const expectedResponse = { data: { items: [], totalItems: 0 } };

    const response = BuildResponse();
    expect(response).deep.eq(expectedResponse);
  });

  it("should return items as an array when payload is an object", () => {
    const expectedResponse = { data: { items: [{}], totalItems: 1 } };

    const response = BuildResponse({});
    expect(response).deep.eq(expectedResponse);
  });

  it("should return items as array when payload is an object with data", () => {
    const payload = { a: 1, b: 2 };
    const expectedResponse = { data: { items: [payload], totalItems: 1 } };

    const response = BuildResponse(payload);
    expect(response).deep.eq(expectedResponse);
  });

  it("should return pagination with 1 item and 2 total items", () => {
    const pagination = { totalItems: 2, page: 1, nextPage: 2 };
    const payload = { data: [{ name: "test" }], pagination };
    const expectedResponse = { data: { items: [{ name: "test" }], totalItems: 1 }, pagination };

    const response = BuildResponse(payload);
    expect(response).deep.eq(expectedResponse);
  });
});
