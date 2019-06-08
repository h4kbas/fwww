import { constants, IncomingHttpHeaders, ServerHttp2Stream } from "http2";
const { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH } = constants;

export class Request {
  public Controller: string = "";
  public Action: string = "";
  public Params: string[] = [];
  public Method: string;
  public Path: string;
  public Stream: ServerHttp2Stream;
  public Headers: IncomingHttpHeaders;

  constructor(headers: IncomingHttpHeaders, stream: ServerHttp2Stream) {
    this.Path = headers[HTTP2_HEADER_PATH] as string;
    this.Method = headers[HTTP2_HEADER_METHOD] as string;
    this.Headers = headers;
    this.Stream = stream;
  }

  public Abort(response: number) {
    this.Stream.respond({ ":status": response });
    this.Stream.end();
  }
}
