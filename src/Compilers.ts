import path from "path";
import { configCache } from "./ConfigCache";
import { includeTreeGlobals } from "./Globals";
import Include from "./Include";
import IncludeTree from "./IncludeTree";
import * as vscode from 'vscode';

import { spawn } from "child_process";
export interface Compiler {
    buildTree(cwd: string, fileUri: vscode.Uri, additionalIncludeUris: string[]): Promise<IncludeTree | undefined>;
}
export class Dummy implements Compiler {
    constructor(private compilerPath: string) { }

    async buildTree(cwd: string, fileUri: vscode.Uri, additionalIncludeUris: string[]): Promise<IncludeTree | undefined> {
        return undefined;
    }
}

/* Both Gcc and clang accept the same -H flag => No distinction necessary. */
export class GenericCompiler implements Compiler {
    constructor(private compilerPath: string) { }

    async buildTree(cwd: string, fileUri: vscode.Uri, additionalIncludeUris: string[]): Promise<IncludeTree | undefined> {
        return new Promise((resolve, reject) => {
            const stack: { depth: number; node: Include }[] = [];
            const rootNodes: Include[] = [];
            let output = "";
            const eolCharacter = process.platform === 'win32' ? "\r\n" : "\n";

            includeTreeGlobals.outputChannel?.clear();

            let includeStrings = [];

            for (let includeUri of additionalIncludeUris) {
                includeStrings.push(`-I${includeUri}`);
            }

            const cmdString = `${this.compilerPath} -fsyntax-only ${includeStrings.join(" ")} -H ${fileUri.fsPath}`;

            includeTreeGlobals.outputChannel?.append(`${cmdString} ${eolCharacter}`);

            const prog = spawn(this.compilerPath, ["-fsyntax-only", ...includeStrings, "-H", fileUri.fsPath], { cwd: cwd });

            prog.stderr.on('data', (data: any) => {
                output += data.toString(); /* GCC outputs its output to stderr for whatever reason */
            });

            prog.on('close', (code: number) => {
                if (output === '') { return resolve(undefined); }

                includeTreeGlobals.outputChannel?.append(output);

                const lines = output.split(eolCharacter);
                for (const line of lines) {
                    const match = line.match(/^(\.+)\s(.+)$/);
                    if (!match) { continue; };

                    const depth = match[1].length;
                    let name = match[2].trim();

                    if (depth > configCache.maxIncludeDepth) {
                        continue;
                    }

                    if (!path.isAbsolute(name)) {
                        name = path.resolve(cwd, name);
                    }
                    const node: Include = new Include(vscode.Uri.file(name), []);

                    // Clean up stack to match current depth
                    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
                        stack.pop();
                    }

                    if (stack.length === 0) {
                        rootNodes.push(node);
                    } else {
                        stack[stack.length - 1].node.includes.push(node);
                    }

                    stack.push({ depth, node });
                }

                return resolve(new IncludeTree(rootNodes));
            });
        });
    }
}