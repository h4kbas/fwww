import { createSecureServer, Http2SecureServer, IncomingHttpHeaders, ServerHttp2Stream } from "http2";
import { Request } from "./Request";
import { existsSync } from "fs";

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
  Context: Context,
  AllowHTTP1: boolean
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
      allowHTTP1: this.Options.AllowHTTP1,
    });

    //URL Router, Request etc
    this.Server.on("stream", (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => {
      try {
        const request = new Request(headers, stream);
        const context = Object.create(this.Options.Context);
        // Root
        if (request.Path == "/") {
          request.Controller = this.Options.Root;
          request.Action = "Index";
        }
        // File
        else if (ExtensionRegex.test(request.Path)) {
          const file = this.Options.Public + request.Path;
          if (existsSync(file)) {
            request.File(file);
          }
          else {
            request.Abort(404);
          }
        }
        // URL
        else {
          //Consequtively: request.Controller, request.Action?, ...Params?
          const paths = request.Path.split("/"); paths.shift();
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
        // Check URL exists
        if (request.Controller in this.Options.Controllers &&
          request.Action in this.Options.Controllers[request.Controller]) {
          const Controller = this.Options.Controllers[request.Controller];
          let Blocked = false;
          const Block = () => Blocked = true;
          for(let MW of Controller.Middlewares){
            if("Before" in MW){
              MW.Before(request, context, Block);
            }
            if("After" in MW){
              MW.After(request, context, Block);
            }
            //If Middleware calls Block method Fallback will be executes if available
            if(Blocked){
              if("Fallback" in MW){
                MW.Fallback(request, context);
                break;
              }
            } 
          }
          //Call the method for corresponding url if not blocked
          if(!Blocked){
            Controller[request.Action](request, context);
          }
        }
        else {
          request.Abort(404);
        }
      }
      catch (e) {
        // tslint:disable-next-line: no-console
        console.error(e);
      }
    });

    // Activate Server
    this.Server.listen(this.Options.Port);
  }
}
