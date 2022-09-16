/**
 * Retrieves the application configuration from environment variables
 * or use default values when no environment variables present.
 */
export const appConfigEnv = () => ({
  port: process.env.SERVICE_PORT || 8080,
  name: process.env.SERVICE_NAME || "zero",
  context: process.env.SERVICE_CONTEXT || "",
  limit: process.env.SERVICE_LIMIT_SIZE_JSON || "200kb"
});

const skipEndpoints = () => {
  const endpoints = process.env.SERVICE_SKIP_ENDPOINTS?.split(",") || [];
  return [...endpoints, "/health"];
};

/**
 * Retrieves the context configuration from environment variables
 * or use default values when no environment variables present.
 */
export const contextConfigEnv = () => ({
  skipEndpoints: skipEndpoints(),
  host: process.env.SERVICE_HOST || "localhost",
  secret: process.env.JWT_PUBLIC_KEY || "super-secret",
  discriminatorKey: process.env.DISCRIMINATOR_KEY || "contractId",
  discriminatorClaim: process.env.DISCRIMINATOR_CLAIM || "contracts"
});
