import { OutputChannel } from "vscode";
import IncludeTree from "./IncludeTree";


export enum TreeMode {
    WHOAMIINCLUDING = "whoAmIIncluding",
    WHOISINCLUDINGME = "whoIsIncludingMe"
}

export default class Globals {
    constructor(public parsedCompileCommandsJson: any | undefined = undefined, public outputChannel: OutputChannel | undefined = undefined) { }

    workspaceIncludes: string[] = [];

    fileCache: Map<string, IncludeTree | undefined> = new Map();
    isFilePinned: boolean = false;
    treeMode: TreeMode = TreeMode.WHOAMIINCLUDING;

}


var includeTreeGlobals: Globals = new Globals();

export { includeTreeGlobals };