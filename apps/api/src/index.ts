import { createApp } from "./app";
import { loadConfig } from "./config";
import { createInMemoryUserRepository, seedUser } from "./users";

const config = loadConfig();
const user = await seedUser(config.seedEmail, config.seedPassword);

createApp({
  users: createInMemoryUserRepository([user]),
  jwtSecret: config.jwtSecret,
  corsOrigin: config.corsOrigin,
  secureCookies: config.secureCookies,
}).listen(config.port, () => console.log(`API listening on :${config.port}`));
