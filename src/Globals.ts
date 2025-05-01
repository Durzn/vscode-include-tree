import { OutputChannel } from "vscode";

export default class Globals {
    constructor(public parsedCompileCommandsJson: any | undefined = undefined, public outputChannel: OutputChannel | undefined = undefined) { }

    workspaceIncludes: string[] = [];

}


var includeTreeGlobals: Globals = new Globals();

export { includeTreeGlobals };