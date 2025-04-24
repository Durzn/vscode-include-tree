import ConfigAccess from './ConfigAccess';
import { Compiler, Gcc } from './Compilers';
import * as vscode from 'vscode';

export default class ConfigCache {

    public configAccess: ConfigAccess;

    /* Config parameters */
    public compiler!: Compiler;


    constructor() {
        this.configAccess = new ConfigAccess();
        this.onConfigChange();
    }

    public onConfigChange() {
        /* Config parameters */
        this.compiler = getCompilerFromUri(this.configAccess.getCompilerUri());
    }
}

function getCompilerFromUri(uri: vscode.Uri) {
    /* Only support Gcc for now */
    return new Gcc(uri);
}

var configCache: ConfigCache = new ConfigCache();

export { configCache };