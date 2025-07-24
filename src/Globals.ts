import { OutputChannel, Uri } from "vscode";
import IncludeTree from "./IncludeTree";

export default class Globals {
    constructor(public parsedCompileCommandsJson: any | undefined = undefined, public outputChannel: OutputChannel | undefined = undefined) { }

    workspaceIncludes: string[] = [];

    fileCache: Map<string, IncludeTree | undefined> = new Map();
    isFilePinned: boolean = false;

}


var includeTreeGlobals: Globals = new Globals();

export { includeTreeGlobals };