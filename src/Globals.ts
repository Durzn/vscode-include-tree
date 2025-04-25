import { OutputChannel } from "vscode";

export default class Globals {
    constructor(public outputChannel: OutputChannel | undefined = undefined) { }
}



var includeTreeGlobals: Globals = new Globals();

export { includeTreeGlobals };