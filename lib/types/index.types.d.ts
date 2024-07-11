export interface URLData {
    type: Types;
    oid: string;
    id: string;
}
export interface VideoData extends GenericData {
    direct_url: string;
    filename: string;
}
export interface GenericData {
    mimetype: string;
    filesize: Filesize;
}
export declare enum Types {
    FRONT = "FRONT",
    BACK = "BACK"
}
interface Filesize extends Number {
}
export {};
