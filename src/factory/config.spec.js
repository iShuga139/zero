import { expect } from "chai";
import { appConfigEnv, contextConfigEnv } from "./config.js";

describe("Config", () => {
  describe("with defaults", () => {
    it("should return appConfig", () => {
      const appProps = appConfigEnv();

      expect(appProps).haveOwnProperty("port");
      expect(appProps).haveOwnProperty("name");
      expect(appProps).haveOwnProperty("context");
      expect(appProps).haveOwnProperty("limit");

      expect(appProps.port).to.eq(8080);
      expect(appProps.name).to.eq("zero");
      expect(appProps.context).to.eq("");
      expect(appProps.limit).to.eq("200kb");
    });

    it("should return contextConfig", () => {
      delete process.env.SERVICE_SKIP_ENDPOINTS;
      delete process.env.DISCRIMINATOR_KEY;
      delete process.env.DISCRIMINATOR_CLAIM;
      const contextProps = contextConfigEnv();

      expect(contextProps).haveOwnProperty("host");
      expect(contextProps).haveOwnProperty("secret");
      expect(contextProps).haveOwnProperty("skipEndpoints");
      expect(contextProps).haveOwnProperty("discriminatorKey");
      expect(contextProps).haveOwnProperty("discriminatorClaim");

      expect(contextProps.host).to.eq("localhost");
      expect(contextProps.secret).to.eq("super-secret");
      expect(contextProps.skipEndpoints).contains("/health");
      expect(contextProps.discriminatorKey).contains("contractId");
      expect(contextProps.discriminatorClaim).contains("contracts");
    });
  });

  describe("without defaults", () => {
    it("should return appConfig", () => {
      Object.assign(process.env, {
        SERVICE_PORT: 3000,
        SERVICE_NAME: "test",
        SERVICE_CONTEXT: "/v1",
        SERVICE_LIMIT_SIZE_JSON: "50mb"
      });
      const appProps = appConfigEnv();

      expect(appProps).haveOwnProperty("port");
      expect(appProps).haveOwnProperty("name");
      expect(appProps).haveOwnProperty("context");
      expect(appProps).haveOwnProperty("limit");

      expect(appProps.port).to.eq("3000");
      expect(appProps.name).to.eq("test");
      expect(appProps.context).to.eq("/v1");
      expect(appProps.limit).to.eq("50mb");
    });

    it("should return contextConfig", () => {
      Object.assign(process.env, {
        SERVICE_HOST: "localhost:27027",
        JWT_PUBLIC_KEY: "mega-secret",
        SERVICE_SKIP_ENDPOINTS: "/reset-password"
      });
      const contextProps = contextConfigEnv();

      expect(contextProps).haveOwnProperty("host");
      expect(contextProps).haveOwnProperty("secret");

      expect(contextProps.host).to.eq("localhost:27027");
      expect(contextProps.secret).to.eq("mega-secret");
      expect(contextProps.skipEndpoints).deep.eq(["/reset-password", "/health"]);
    });
  });
});
