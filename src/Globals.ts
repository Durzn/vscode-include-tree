import { OutputChannel } from "vscode";
import IncludeTree from "./IncludeTree";


export enum TreeMode {
    WHOAMIINCLUDING = "whoAmIIncluding",
    WHOISINCLUDINGME = "whoIsIncludingMe"
}

export enum CacheStatus {
    OFF,
    BUILDING,
    BUILT
}

export default class Globals {
    constructor(public parsedCompileCommandsJson: any | undefined = undefined, public outputChannel: OutputChannel | undefined = undefined) { }

    workspaceIncludes: string[] = [];

    isFilePinned: boolean = false;
    treeMode: TreeMode = TreeMode.WHOAMIINCLUDING;
    includeTrees = new Map<string, IncludeTree>();

    cacheStatus = CacheStatus.OFF;

}


var includeTreeGlobals: Globals = new Globals();

export { includeTreeGlobals };