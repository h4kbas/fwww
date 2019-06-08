import { constants, createSecureServer, Http2SecureServer, IncomingHttpHeaders, ServerHttp2Stream, OutgoingHttpHeaders } from "http2";
import { Request } from "./Request";
import { existsSync } from "fs";
import mime from "mime-types";


interface IRoute {
  [cname: string]: any
}

export interface Context {
  [name: string]: any
}

export interface IFWOptions {
  Key: Buffer;
  Cert: Buffer;
  Root: string
  Port: number;
  Public: string;
  Controllers: IRoute,
  Context: Context
}


//For file matching
const ExtensionRegex: RegExp = /.+\..+$/;

export class FW {
  public Options: IFWOptions;
  public Server: Http2SecureServer;
  constructor(ifwoptions: IFWOptions) {
    this.Options = ifwoptions;

    //Security Stuff
    this.Server = createSecureServer({
      cert: this.Options.Cert,
      key: this.Options.Key,
    });

    //URL Router, Request etc
    this.Server.on("stream", (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => {
      const request = new Request(headers, stream);
      //Root
      if (request.Path == "/") {
        request.Controller = this.Options.Root;
        request.Action = "Index";
      }
      //File
      else if (ExtensionRegex.test(request.Path)) {
        const file = this.Options.Public + request.Path;
        if (existsSync(file)) {
          request.Stream.respondWithFile(file, { "content-type": mime.lookup(file) } as OutgoingHttpHeaders, { onError: (err) => request.Abort(500) });
        }
        else {
          request.Abort(404);
        }
      }
      //URL
      else {
        //Consequtively: request.Controller, request.Action?, ...Params?
        const paths = request.Path.split("/");
        if (paths.length == 1) {
          request.Controller = paths[0];
          request.Action = "Index";
        }
        else if (paths.length == 2) {
          request.Controller = paths[0];
          request.Action = paths[1];
        }
        else if (paths.length > 2) {
          request.Controller = paths[0];
          request.Action = paths[1];
          request.Params = paths.slice(3);
        }
      }

      //Check URL exists
      if (request.Controller in this.Options.Controllers && request.Action in this.Options.Controllers[request.Controller]) {
        const Controller = this.Options.Controllers[request.Controller];
        Controller[request.Action](request, this.Options.Context);
      }
      else {
        request.Abort(404);
      }
    });

    //Activate Server
    this.Server.listen(this.Options.Port);
  }
}
