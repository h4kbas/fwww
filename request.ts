import mime from "mime-types";
import { constants, IncomingHttpHeaders, ServerHttp2Stream, OutgoingHttpHeaders } from "http2";
const { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS, HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_AUTHORITY, HTTP2_HEADER_SET_COOKIE} = constants;

export class Request {
  public Host: string = "";
  public Controller: string = "";
  public Action: string = "";
  public Params: string[] = [];
  public Method: string;
  public Path: string;
  public Stream: ServerHttp2Stream;
  public Headers: IncomingHttpHeaders;
  public Cookies: {[s: string]: string} = {};

  constructor(headers: IncomingHttpHeaders, stream: ServerHttp2Stream) {
    this.Host = headers[HTTP2_HEADER_AUTHORITY] as string;
    this.Path = headers[HTTP2_HEADER_PATH] as string;
    this.Method = headers[HTTP2_HEADER_METHOD] as string;
    this.Headers = headers;
    this.Stream = stream;
    
    //Cookies
    this.ParseCookies(headers.cookie as string);
  }

  public Abort(response: number) {
    this.Stream.respond({ [HTTP2_HEADER_STATUS]: response });
    this.Stream.end();
  }

  public Write(response: string) {
    this.Stream.write(response);
  }

  public OK(response: string) {
    this.Stream.end(response);
  }

  public File(file: string) {
    this.Stream.respondWithFile(file, { HTTP2_HEADER_CONTENT_TYPE: mime.lookup(file) } as OutgoingHttpHeaders, { onError: (err) => this.Abort(500) });
  }

  public Cookie(key: string, value: string, expires?:Date){
    this.Stream.respond({[HTTP2_HEADER_SET_COOKIE]: [`${key}=${value}${expires ? ";expires=" + expires.toUTCString(): ""}`]});
  }

  public RemoveCookie(key: string){
    this.Stream.respond({[HTTP2_HEADER_SET_COOKIE]: [`${key}=;expires=${(new Date()).toUTCString()}`]});
  }

  private ParseCookies(cookie: string){
    const Rule = /([^;=\s]*)=([^;]*)/g;
    for(let M; M = Rule.exec(cookie);)
    this.Cookies[ M[1] ] = decodeURIComponent(M[2]);
  }

  private StringifyCookies() {
    let L = [];
    for(const [K, V] of Object.entries(this.Cookies))
      L.push(K + '=' + encodeURIComponent(V));
    return L.join('; ');
  }
}
