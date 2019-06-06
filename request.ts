import { constants, IncomingHttpHeaders, ServerHttp2Stream } from "http2";
const { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH } = constants;

export default class Request {
  public Method: string;
  public Path: string;
  public Stream: ServerHttp2Stream;
  public Headers: IncomingHttpHeaders;

  constructor(headers: IncomingHttpHeaders, stream: ServerHttp2Stream) {
    this.Path = headers[HTTP2_HEADER_PATH].toString();
    this.Headers = headers;
    this.Method = headers[HTTP2_HEADER_METHOD].toString();
    this.Stream = stream;
  }

  public abort(response: number) {
    this.Stream.respond({ ":status": response });
    this.Stream.end();
  }
}
