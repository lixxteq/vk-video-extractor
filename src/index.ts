import axios, { Axios, AxiosResponse } from 'axios';
import { GenericData, Types, URLData, VideoData } from '../types/index.types'
import { parse } from 'node-html-parser'
import { createWriteStream, rm, accessSync } from 'fs';
import { default as p } from 'path'
import { finished } from 'stream/promises';
import { randomBytes } from 'node:crypto'
// @ts-ignore
import * as mime from 'mime-types' 

const BASEHEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-us,en;q=0.5"
}

const SRCHEADERS = {
    "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.7",
    "Accept-Encoding": "gzip, deflate",
}

const DOMAINS = {
    FRONT: ["vk.com", "vk.ru"],
    BACK: ["vk-cdn.net", "vkuservideo.net", /sun[\d*\-]*\.userapi\.com/, /vkvd\d*.mycdn.me/]
}

const URLREGEX = /"url\d{3,4}"\s*:\s*([^;,]+);?/g

class Extractor {
    url: string
    private http: Axios
    private _cached: VideoData | undefined = undefined


    constructor(url?: string, oid?: number | string, id?: number | string) {
        if (url) { this.url = url } 
        else if (oid && id) { this.url = `https://vk.com/video${oid}_${id}` } 
        else { throw new Error('Extractor requires video url or oid with id') }
        this.http = axios.create({
            headers: BASEHEADERS
        })
    }

    public download = async (path?: string, filename?: string): Promise<string> => {
        var _info = this._cached ?? await this.getVideoInfo()
        if (path && !Extractor._pathExists(path)) throw new Error('Download path does not exist: ' + path)
        var download_path = p.join(path ?? process.cwd(), filename ?? _info.filename)
        var res = await Extractor._download(_info.direct_url, download_path)
        return download_path
    }

    public static downloadResourceByDirectUrl = async (url: string, path?: string, filename?: string): Promise<string> => {
        if (path && !this._pathExists(path)) throw new Error('Download path does not exist: ' + path)
        var _info = await this.getResourceInfo(url)
        
        var download_path = p.join(path ?? process.cwd(), filename ?? `${randomBytes(16).toString('hex')}.${mime.extension(_info.mimetype) === 'mpga' ? 'mp3' : mime.extension(_info.mimetype)}`)
        var res = await this._download(url, download_path)
        return download_path
    }

    private static _download = async (url: string, path: string): Promise<void> => {
        var _fds = createWriteStream(path)
        var _resp = await axios.get(url, { responseType: 'stream', headers: {...BASEHEADERS, ...SRCHEADERS} })

        _resp.data.pipe(_fds)
        return finished(_fds)
    }

    public static delete = async (path: string) => {
        rm(path, (err) => { if (err) throw err })
    }

    private static _head = async (url: string) => { return await axios.head(url, { headers: {...BASEHEADERS, ...SRCHEADERS} }) }

    public getVideoInfo = async (): Promise<VideoData> => {
        var direct_url = await this.getDirectUrl(true)
        var _head = await this.http.head(direct_url, { headers: SRCHEADERS })
        if (_head.status !== 200) throw new Error('Failed to get video info')
        
        var _info: VideoData = {
            ...Extractor._extractGenericData(_head), 
            direct_url, 
            filename: _head.headers['content-disposition'].split(';')[1].split('=')[1].replace(/"/g, '')}
        this._setCachedInfo(_info)
        return _info
    }

    public static getResourceInfo = async (resource_url: string): Promise<GenericData> => {
        var _head = await this._head(resource_url)
        if (_head.status !== 200) throw new Error('Failed to get resource info')
        
        var _info = this._extractGenericData(_head)
        return _info
    }

    private static _extractGenericData = (resp: AxiosResponse): GenericData => {
        var _info: GenericData = {
            mimetype: resp.headers['content-type'],
            filesize: new Filesize(resp.headers['content-length'])
        }
        return _info
    }

    public getDirectUrl = async (data_pass?: boolean): Promise<string> => {
        var player_url = this._createPlayerUrl()
        var player_page = await this.http.get(player_url.toString(), { responseType: 'document' })
        if (player_page.status !== 200) throw new Error('Failed to get player page')
        var _html = parse(player_page.data)

        var _val = _html.querySelector('body')?.querySelectorAll('script')[1].innerHTML.matchAll(URLREGEX)
        if (!_val) throw new Error('Failed to get direct url')
        var _arr = Array.from(_val)
        var _best_quality_match = typeof _arr[0] === 'object' ? _arr[_arr.length-1][1] : _arr[1]
        // @ts-ignore
        return _best_quality_match.replace(/["]+/g, '').replaceAll("\\", "")
    }

    private _createPlayerUrl = (): URL => {
        var base = new URL("https://vk.com/video_ext.php")
        var { type, ...args } = { hd: "2", ...this._parseUrl() }
        base.search = new URLSearchParams(args).toString()
        return base
    }

    private _parseUrl = (): URLData => {
        var u = new URL(this.url)
        var type = DOMAINS.FRONT.includes(u.hostname) ? Types.FRONT : DOMAINS.BACK.some(v => typeof v === "string" ? v === u.hostname : v.test(u.hostname)) ? Types.BACK : undefined
        if (!type) throw new Error('Unknown domain')

        var raw_id = u.searchParams.has("z") ? u.searchParams.get("z") : u.pathname.slice(1)
        if (!raw_id || !raw_id.startsWith("video")) throw new Error('Invalid url')

        var _raw_id_parse = (raw_id: string): string[] => { return raw_id.slice(5).slice(0, raw_id.indexOf("%") === -1 ? undefined : raw_id.indexOf("%")).split("_") }

        return {
            type: type,
            oid: _raw_id_parse(raw_id)[0],
            id: _raw_id_parse(raw_id)[1]
        }
    }

    private _parseFallback = () => { }

    private _setCachedInfo = (info: VideoData) => { this._cached = info }

    private static _pathExists = (path: string) => {
        try {
            accessSync(path)
            return true
        } catch (error) {
            return false
        }
    }
}

class Filesize extends Number {
    constructor(value: string) {
        super(value)
    }

    public asMegabytes = (): number => {
        return this.valueOf() / 1024 / 1024
    }

    public asBytes = (): number => {
        return this.valueOf()
    }
}

export {
    Extractor as default
}