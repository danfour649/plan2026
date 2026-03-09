// App version from package.json for display on About page
import packageJson from "../../package.json";

export const APP_VERSION = (packageJson as { version?: string }).version ?? "0.0.0";
