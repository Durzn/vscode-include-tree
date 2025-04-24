import * as vscode from 'vscode';
import IncludeTree from '../IncludeTree';
import Include from '../Include';
import IncludeTreeItem from './IncludeTreeItem';

export default class NodeDependenciesProvider implements vscode.TreeDataProvider<IncludeTreeItem> {
    constructor(private includeTree: IncludeTree | undefined = undefined) { }

    getTreeItem(element: IncludeTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: IncludeTreeItem): Thenable<IncludeTreeItem[]> {
        let elements: IncludeTreeItem[] = [];
        let includes: Include[] = [];
        if (element) {
            includes = element.include.includes;
        } else {
            if (this.includeTree) {
                includes = this.includeTree.rootNodes;
            }
        }
        for (let include of includes) {
            elements.push(new IncludeTreeItem(include, include.fileName));
        }
        return Promise.resolve(elements);
    }

    public setIncludeTree(includeTree: IncludeTree) {
        this.includeTree = includeTree;
        this.refresh();
    }

    private _onDidChangeTreeData: vscode.EventEmitter<IncludeTreeItem | undefined | null | void> = new vscode.EventEmitter<IncludeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<IncludeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

}