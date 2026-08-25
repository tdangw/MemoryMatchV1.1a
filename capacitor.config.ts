import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.memorymatch.adventure",
  appName: "Memory Match Adventure",
  webDir: "dist",
  android: {
    allowMixedContent: false,
    backgroundColor: "#10162f",
  },
};

export default config;
