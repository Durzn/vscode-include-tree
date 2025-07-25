import Include from './Include';
import * as vscode from 'vscode';


export default class IncludeTree {
    constructor(public includes: Include[]) {
        for (let node of this.includes) {
            this.setParent(node);
        }
    }

    public flatten(nodes: Include[] = this.includes): Include[] {
        const includes = nodes.reduce((accumulator, node) => {
            accumulator.push(node);
            if (node.includes.length > 0) {
                accumulator = accumulator.concat(this.flatten(node.includes));
            }
            return accumulator;
        }, [] as Include[]);

        return includes;
    }

    private setParent(node: Include) {
        for (let include of node.includes) {
            include.parent = node;
            this.setParent(include);
        }
    }
}
