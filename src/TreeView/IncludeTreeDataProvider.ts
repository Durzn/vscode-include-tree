import * as vscode from 'vscode';
import IncludeTree from '../IncludeTree';
import Include from '../Include';
import IncludeTreeItem from './IncludeTreeItem';
import { configCache } from '../ConfigCache';

export default class IncludeTreeDataProvider implements vscode.TreeDataProvider<IncludeTreeItem> {
    private elements: IncludeTreeItem[] = [];
    private expandedElements = new Set<string>();

    constructor(private includeTree: IncludeTree | undefined = undefined) {
        this.setIncludeTree(includeTree);
    }

    public getTreeItem(element: IncludeTreeItem): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: IncludeTreeItem): Thenable<IncludeTreeItem[]> {
        let includes: Include[] = [];
        if (element) {
            includes = element.include.includes;
        } else {
            if (this.includeTree) {
                includes = this.includeTree.rootNodes;
            }
        }
        const items = this.convertIncludesToIncludeTreeItems(includes);
        return Promise.resolve(items);
    }

    public getParent(element: IncludeTreeItem): IncludeTreeItem | null {
        if (element.include.parent) {
            return this.elements.find(item => item.include.id === element.include.parent?.id) || null;
        }
        return null;
    }


    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public setExpansionState(elementId: string, isExpanded: boolean) {
        let element = this.elements.find(element => element.include.id === elementId);
        if (!element) { return; }
        if (isExpanded) {
            this.expandedElements.add(element.include.id);
        }
        else {
            this.expandedElements.delete(element.include.id);
        }
    }

    public clearExpansionState(): void {
        this.expandedElements.clear();
    }

    public setIncludeTree(includeTree: IncludeTree | undefined) {
        this.includeTree = includeTree;
        if (includeTree) {
            this.elements = this.convertIncludesToIncludeTreeItems(includeTree.flatten());
        }
        this.refresh();
    }

    private convertIncludesToIncludeTreeItems(includes: Include[]): IncludeTreeItem[] {
        let items: IncludeTreeItem[] = [];

        for (const include of includes) {
            const currentItemState = this.expandedElements.has(include.id) ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
            const collapsibleState = include.includes.length === 0 ? vscode.TreeItemCollapsibleState.None : currentItemState;
            let command: vscode.TreeItem["command"] | undefined = undefined;
            if (configCache.openFilesOnClick) {
                command = {
                    'title': "Open file",
                    'command': "include-tree.open",
                    'tooltip': "Open file",
                    'arguments': [include.fileUri]
                };
            }
            const item = new IncludeTreeItem(include, include.getFileName(), command, vscode.ThemeIcon.File, include.fileUri, collapsibleState);
            items.push(item);
        }

        return items;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<IncludeTreeItem | undefined | null | void> = new vscode.EventEmitter<IncludeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<IncludeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
}