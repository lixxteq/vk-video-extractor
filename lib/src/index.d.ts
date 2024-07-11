import { Axios } from 'axios';
import { GenericData, VideoData } from '../types/index.types';
declare class Extractor {
    url: string;
    http: Axios;
    private _cached;
    constructor(url?: string, oid?: number | string, id?: number | string);
    download: (path?: string, filename?: string) => Promise<string>;
    private static _download;
    static downloadResourceByUrl: (url: string, path?: string, filename?: string) => Promise<string>;
    private static _delete;
    private static _head;
    get_video_info: () => Promise<VideoData>;
    static get_resource_info: (resource_url: string) => Promise<GenericData>;
    private static _extract_generic_data;
    get_direct_url: (data_pass?: boolean) => Promise<string>;
    private _create_player_url;
    private _parse_url;
    private _parse_fallback;
    private _set_cached_info;
    private static _path_exists;
}
export { Extractor as default };
