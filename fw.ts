import { constants, Http2SecureServer, IncomingHttpHeaders, ServerHttp2Session, ServerHttp2Stream } from "http2";
const { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP2_HEADER_PATH, HTTP2_HEADER_METHOD } = constants;
import mime from "mime-types";
import { join } from "path";


interface IFWOptions {
  Key: Buffer;
  Cert: Buffer;
  Root: string;
}

interface IRequest {
  Method: string;
  FullPath: string;
  Stream: ServerHttp2Stream;
  Headers: IncomingHttpHeaders;
}

export default class FW {
  public Options: IFWOptions;
  public Server: Http2SecureServer;

  constructor() {
    this.Server.on("stream", (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => {

      const request: IRequest = {
        FullPath: join(this.Options.Root, headers[HTTP2_HEADER_PATH].toString()),
        Headers: headers,
        Method: headers[HTTP2_HEADER_METHOD].toString(),
        Stream: stream,
      };

    });
  }

  public abort(err: NodeJS.ErrnoException, stream: ServerHttp2Stream) {
    // tslint:disable-next-line: no-console
    console.log(err);
    if (err.code === "ENOENT")
      stream.respond({ ":status": HTTP_STATUS_NOT_FOUND });
    else
      stream.respond({ ":status": HTTP_STATUS_INTERNAL_SERVER_ERROR });
    stream.end();
  }
}