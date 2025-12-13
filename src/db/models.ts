
export const UNIT_SEPARATOR = "\x1f";

export const DEFAULT_MODEL_ID = 1700000000000;

export const DEFAULT_DECK_ID = 1;


export interface AnkiModel {
  id: number;
  name: string;
  type: number;   mod: number;   usn: number;
  sortf: number;   did: number;   tmpls: any[];   flds: any[];   css: string;
  latexPre: string;
  latexPost: string;
  latexSvg: boolean;
  req: any[];
}

export interface AnkiDeck {
    id: number;
    mod: number;
    name: string;
    usn: number;
    lrnToday: [number, number];     revToday: [number, number];
    newToday: [number, number];
    timeToday: [number, number];
    collapsed: boolean;
    browserCollapsed: boolean;
    desc: string;
    dyn: number;     conf: number;     extendNew: number;
    extendRev: number;
}

export interface AnkiConf {
    nextPos: number;     estTimes: boolean;     activeDecks: number[];     sortType: string;
    timeLim: number;
    sortBackwards: boolean;
    addToCur: boolean;
    curDeck: number;
    newBury: boolean;
    newSpread: number;
    dueCounts: boolean;
    curModel: number;
    collapseTime: number;
}


export const joinFields = (fields: string[]): string => {
    return fields.join(UNIT_SEPARATOR);
}

export const splitFields = (flds: string): string[] => {
    return flds.split(UNIT_SEPARATOR);
}

export const getDefaultModel = (): AnkiModel => ({
    id: DEFAULT_MODEL_ID,
    name: "Basic (LinguaFlow)",
    type: 0,
    mod: Date.now(),
    usn: -1,
    sortf: 0,
    did: DEFAULT_DECK_ID,
    tmpls: [
        {
            name: "Card 1",
            ord: 0,
            qfmt: "{{Front}}",
            afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
            bqfmt: "",
            bafmt: "",
            did: null,
        }
    ],
    flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Notes", ord: 2, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },         { name: "Audio", ord: 3, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Image", ord: 4, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
    ],
    css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
    latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexPost: "\\end{document}",
    latexSvg: false,
    req: [[0, "all", [0]]], });

export const getDefaultDeck = (): AnkiDeck => ({
    id: DEFAULT_DECK_ID,
    mod: Date.now(),
    name: "Default",
    usn: -1,
    lrnToday: [0, 0],
    revToday: [0, 0],
    newToday: [0, 0],
    timeToday: [0, 0],
    collapsed: false,
    browserCollapsed: false,
    desc: "",
    dyn: 0,
    conf: 1,
    extendNew: 0,
    extendRev: 0,
});

export const getDefaultConf = (): AnkiConf => ({
    nextPos: 1,
    estTimes: true,
    activeDecks: [1],
    sortType: "noteFld",
    timeLim: 0,
    sortBackwards: false,
    addToCur: true,
    curDeck: 1,
    newBury: true,
    newSpread: 0,
    dueCounts: true,
    curModel: DEFAULT_MODEL_ID,
    collapseTime: 1200,
});
