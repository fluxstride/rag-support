import { UUID } from "crypto";

export interface Feed{
    uid:UUID,
    userid:UUID,
    body:string,
    like:number,
    comment:string
}