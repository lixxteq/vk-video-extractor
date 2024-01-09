export interface URLData {
    type: Types,
    oid: string,
    id: string
}

export enum Types {
    FRONT = "FRONT",
    BACK = "BACK"
}