import axios, {Axios} from 'axios';
import { Types, URLData } from '../types/index.types'
import { parse } from 'node-html-parser'
import { readFileSync } from 'fs';

const BASEHEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-us,en;q=0.5"
}

const DOMAINS = {
    FRONT: ["vk.com", "vk.ru"],
    BACK: ["vk-cdn.net", "vkuservideo.net", /sun[\d*\-]*\.userapi\.com/, /vkvd\d*.mycdn.me/]
}

const URLREGEX = /"url720"\s*:\s*([^;,]+);?/g

class Extractor {
    url: string
    http: Axios
    constructor(url: string) {
        this.url = url
        this.http = axios.create({
            headers: BASEHEADERS
        })
    }

    public get_direct_url = async (): Promise<string> => {
        var player_url = this._create_player_url()
        var player_page = await this.http.get(player_url.toString(), {responseType: 'document'})
        if (player_page.status !== 200) throw new Error('Failed to get player page')
        var _html = parse(player_page.data)
        // var data = readFileSync('./test.html', 'utf8')
        // var _html = parse(data)
        var _val = _html.querySelector('body')?.querySelectorAll('script')[1].innerHTML.matchAll(URLREGEX)
        if (!_val) throw new Error('Failed to get direct url')
        return _val.next().value[1].replace(/["]+/g, '').replaceAll("\\", "")
    }

    private _create_player_url = (): URL => {
        var base = new URL("https://vk.com/video_ext.php")
        var {type, ...args} = {hd: "2", ...this._parse_url()}
        base.search = new URLSearchParams(args).toString()
        return base
    }

    protected _parse_url = (): URLData => {
        var u = new URL(this.url)
        var type = DOMAINS.FRONT.includes(u.hostname) ? Types.FRONT : DOMAINS.BACK.some(v => typeof v === "string" ? v === u.hostname : v.test(u.hostname)) ? Types.BACK : undefined
        if (!type) throw new Error('Unknown domain')

        var raw_id = u.searchParams.has("z") ? u.searchParams.get("z") : u.pathname.slice(1)
        if (!raw_id || !raw_id.startsWith("video")) throw new Error('Invalid url')

        var _raw_id_parse = (raw_id: string): string[] => {return raw_id.slice(5).slice(0, raw_id.indexOf("%") === -1 ? undefined : raw_id.indexOf("%")).split("_")}

        return {
            type: type,
            oid: _raw_id_parse(raw_id)[0],
            id: _raw_id_parse(raw_id)[1]
        }
    }

    private _parse_fallback = () => {}
}

export {
    Extractor as default
}