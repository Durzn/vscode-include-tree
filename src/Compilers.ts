import { configCache } from "./ConfigCache";
import { includeTreeGlobals } from "./Globals";
import Include from "./Include";
import IncludeTree from "./IncludeTree";
import * as vscode from 'vscode';

const { spawn } = require('child_process');

export interface Compiler {
    buildTree(fileUri: vscode.Uri): Promise<IncludeTree | undefined>;
}
export class Dummy implements Compiler {
    constructor(private compilerPath: string) { }

    async buildTree(fileUri: vscode.Uri): Promise<IncludeTree | undefined> {
        return undefined;
    }
}

export class Gcc implements Compiler {
    constructor(private compilerPath: string) { }

    async buildTree(fileUri: vscode.Uri): Promise<IncludeTree | undefined> {
        return new Promise((resolve, reject) => {
            const stack: { depth: number; node: Include }[] = [];
            const rootNodes: Include[] = [];
            let output = "";

            includeTreeGlobals.outputChannel?.clear();

            includeTreeGlobals.outputChannel?.append(`${this.compilerPath} -fmax-include-depth=${configCache.maxIncludeDepth} -fsyntax-only -H ${fileUri.fsPath}`);

            const prog = spawn(this.compilerPath, [`-fmax-include-depth=${configCache.maxIncludeDepth}`, "-fsyntax-only", "-H", fileUri.fsPath]);

            prog.stderr.on('data', (data: any) => {
                output += data.toString(); /* GCC outputs its output to stderr for whatever reason */
            });

            prog.on('close', (code: number) => {
                if (output === '') { return resolve(undefined); }

                includeTreeGlobals.outputChannel?.append(output);

                const eolCharacter = process.platform === 'win32' ? "\r\n" : "\n";
                const lines = output.split(eolCharacter);
                for (const line of lines) {
                    const match = line.match(/^(\.+)(.+)$/);
                    if (!match) { continue; };

                    const depth = match[1].length;
                    const name = match[2].trim();

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

export class Clang implements Compiler {
    constructor(private compilerPath: string) { }

    async buildTree(fileUri: vscode.Uri): Promise<IncludeTree | undefined> {
        return new Promise((resolve, reject) => {
            const stack: { depth: number; node: Include }[] = [];
            const rootNodes: Include[] = [];
            let output = "";

            includeTreeGlobals.outputChannel?.clear();

            includeTreeGlobals.outputChannel?.append(`${this.compilerPath} -fsyntax-only -H ${fileUri.fsPath}`);

            const prog = spawn(this.compilerPath, ["-fsyntax-only", "-H", fileUri.fsPath]);

            prog.stderr.on('data', (data: any) => {
                output += data.toString(); /* GCC outputs its output to stderr for whatever reason */
            });

            prog.on('close', (code: number) => {
                if (output === '') { return resolve(undefined); }

                includeTreeGlobals.outputChannel?.append(output);

                const eolCharacter = process.platform === 'win32' ? "\r\n" : "\n";
                const lines = output.split(eolCharacter);
                for (const line of lines) {
                    const match = line.match(/^(\.+)(.+)$/);
                    if (!match) { continue; };

                    const depth = match[1].length;
                    const name = match[2].trim();

                    if (depth > configCache.maxIncludeDepth) {
                        continue;
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