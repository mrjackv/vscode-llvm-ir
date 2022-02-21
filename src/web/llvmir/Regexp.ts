export namespace Regexp {
    // Fragments

    // Standard identifier from https://llvm.org/docs/LangRef.html#identifiers
    const identifierFrag = "[-a-zA-Z$._][-a-zA-Z$._0-9]*";

    // Matches global identifiers
    const globalVarFrag = `@${identifierFrag}`;

    // Matches only non-anonymous locals
    const localVarFrag = `%${identifierFrag}`;

    // Matches local identifiers
    const allLocalVarFrag = `%(${identifierFrag}|\\d+)`;

    // Matches attributes
    const attributeGroupFrag = `#\\d+`;

    // Matches metadata
    const metadataFrag = `!\\d+`;

    // We vacuum up all identifiers by "OR-ing" all of them
    const allIdentifiersFrag = `(${globalVarFrag}|${allLocalVarFrag}|${attributeGroupFrag}|${metadataFrag})`;

    // Regexes

    // Generic identifier regex, without named capture
    // Used with getWordRangeAtPosition
    export const identifier = new RegExp(`${allIdentifiersFrag}`);

    // We consider an assignment an identifier followed by a '='
    // Since the named capture 'ass' is first it will have precedence
    // otherwise it is a reference it will show up in the named caputure 'ref'
    export const refOrAss = new RegExp(`((?<ass>${allIdentifiersFrag})\\s*=|(?<ref>${allIdentifiersFrag}))`, "g");

    // We take all locals followed by comma
    // to be an "assignment" to a local variable
    // This is used in function declarations to grab
    // the 'assignment' of the function's parameters
    export const argument = new RegExp(`(?<ass>${localVarFrag})\\s*,`, "g");

    // Labels are matched inside the 'label' capture to ease processing
    export const label = new RegExp(`(?<label>(${identifierFrag}|\\d+)):`);

    // We capture function name to 'funcid'
    // and the arguments to 'args'
    // 'open' if present means that the function has a body
    export const define = new RegExp(`^define.*(?<funcid>${globalVarFrag})\\((?<args>.*)\\).*(|(?<open>\\{))\\s*$`);

    // The closing bracket of a function
    export const close = new RegExp("^\\s*}\\s*$");
}
