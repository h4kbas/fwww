import { constants, createSecureServer, Http2SecureServer, IncomingHttpHeaders, ServerHttp2Stream } from "http2";
const { HTTP2_HEADER_PATH } = constants;
import { join } from "path";
import Request from "./request";

export interface IFWOptions {
  Key: Buffer;
  Cert: Buffer;
  Root: string;
}

interface IRoute {
  // tslint:disable-next-line: ban-types
  [route: string]: Function;
}

export class FW {
  public Options: IFWOptions;
  public Server: Http2SecureServer;
  public Routes: IRoute[];
  constructor() {

    this.Server = createSecureServer({
      cert: this.Options.Cert,
      key: this.Options.Key,
    });

    this.Server.on("stream", (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => {
      const request = new Request(headers, stream);
      const FullPath = join(this.Options.Root, headers[HTTP2_HEADER_PATH].toString());
    });
  }
}
