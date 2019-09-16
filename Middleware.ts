import { Request } from "./Request";
import { Context } from "./FW";

export default interface Middleware{
  Before?(R: Request, C: Context, Block: Function): void;
  After?(R: Request, C: Context, Block: Function): void;
  Before?(R: Request, C: Context, Block: Function): void;
  After?(R: Request, C: Context, Block: Function): void;
  Fallback?(R: Request, C: Context): void;
}