import { OutputChannel, Uri } from "vscode";

export default class Globals {
    constructor(public outputChannel: OutputChannel | undefined = undefined) { }

    workspaceIncludes: string[] = [];
    
}


var includeTreeGlobals: Globals = new Globals();

export { includeTreeGlobals };