import config from './playwright.config.js';

// The preview server must mount the same base used by build:gh-pages.
export default {
  ...config,
  testMatch: /ui-art-base\.spec\.js$/,
  webServer: {
    ...config.webServer,
    command: `${config.webServer.command} --base=/MemoryMatchV1.1a/`,
    url: `${config.webServer.url}/MemoryMatchV1.1a/`,
  },
};
