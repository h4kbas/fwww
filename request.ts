import mime from "mime-types";
import { constants, IncomingHttpHeaders, ServerHttp2Stream, OutgoingHttpHeaders } from "http2";
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

  public Write(response: string) {
    this.Stream.write(response);
  }

  public Send(response: string) {
    this.Stream.end(response);
  }

  public File(file: string) {
    this.Stream.respondWithFile(file, { "content-type": mime.lookup(file) } as OutgoingHttpHeaders, { onError: (err) => this.Abort(500) });
    this.Stream.end();
  }
}
