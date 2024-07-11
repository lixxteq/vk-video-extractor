import { GenericData, VideoData } from '../types/index.types';
declare class Extractor {
    url: string;
    private http;
    private _cached;
    constructor(url?: string, oid?: number | string, id?: number | string);
    download: (path?: string, filename?: string) => Promise<string>;
    static downloadResourceByDirectUrl: (url: string, path?: string, filename?: string) => Promise<string>;
    private static _download;
    static delete: (path: string) => Promise<void>;
    private static _head;
    getVideoInfo: () => Promise<VideoData>;
    static getResourceInfo: (resource_url: string) => Promise<GenericData>;
    private static _extractGenericData;
    getDirectUrl: (data_pass?: boolean) => Promise<string>;
    private _createPlayerUrl;
    private _parseUrl;
    private _parseFallback;
    private _setCachedInfo;
    private static _pathExists;
}
export { Extractor as default };
