import { readFileSync } from "fs";
import http2 from "http2";

const options = {
  cert: readFileSync("./selfsigned.crt"),
  key: readFileSync("./selfsigned.key"),
};

const server = http2.createSecureServer(options);
