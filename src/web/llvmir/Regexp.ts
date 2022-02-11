export namespace Regexp {
    export var identifierStr = "[-a-zA-Z$._][-a-zA-Z$._0-9]*";
    export var identifier = new RegExp(`[%@]${identifierStr}`, "g");
    export var assignment = new RegExp(`([%@]${identifierStr})(|\s*)=`);
    export var label = new RegExp(`(${identifierStr}):`);
}
