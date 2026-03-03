// Logging configuration - DO NOT EDIT
import { initLogging, getLogger } from "@openclaw/logging";

initLogging({
  serviceName: "glm-estimator",
  environment: process.env.NODE_ENV || "development",
});

export const logger = getLogger();

export { initLogging, getLogger } from "@openclaw/logging";
