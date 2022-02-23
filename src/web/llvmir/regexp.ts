//
// This file is distributed under the MIT License. See LICENSE.md for details.
//

/**
 * Namespace containing all regexps for parsing LLVM IR
 */
export namespace Regexp {
    // Fragments

    // Standard identifier from https://llvm.org/docs/LangRef.html#identifiers
    const identifierFrag = "[-a-zA-Z$._][-a-zA-Z$._0-9]*";

    // Matches global identifiers
    const globalVarFrag = `@${identifierFrag}`;

    // Matches only non-anonymous locals
    const localVarFrag = `%${identifierFrag}`;

    // Matches local identifiers
    const allLocalVarFrag = xstr(`%(
        ${identifierFrag}|  # Named identifiers
        \\d+                # Anonymous identifiers
    )`);

    // Matches attributes
    const attributeGroupFrag = "#\\d+";

    // Matches metadata
    const metadataFrag = `!(${identifierFrag}|\\d+)`;

    // We vacuum up all identifiers by "OR-ing" all of them
    const allIdentifiersFrag = xstr(`(
        ${globalVarFrag}|           # Global Identifiers
        ${allLocalVarFrag}|         # Local variables
        ${attributeGroupFrag}|      # Attributes
        ${metadataFrag}             # Metadata
    )`);

    // Regexes

    // Generic identifier regex, without named capture
    // Used with getWordRangeAtPosition
    export const identifier = new RegExp(`${allIdentifiersFrag}`);

    /**
     * We consider an assignment an identifier followed by a '='
     * Since the named capture 'value' is first it will have precedence
     * otherwise it is a reference it will show up in the named caputure 'user'
     */
    export const refOrAss = xre(
        `(
            (?<value>${allIdentifiersFrag})\\s*=|       # Assignments are captured first if applicable
            (?<user>${allIdentifiersFrag})              # Otherwise grab identifiers as uses
        )`,
        "g"
    );

    /**
     * We take all locals followed optionally by a comma
     * This is used in function declarations to grab
     * the 'assignment' of the function's parameters
     */
    export const argument = xre(
        `
            (?<value>${localVarFrag})   # Capture local variables in the 'value' capture
            \\s*                        # Whitespace can follow
            (,|)                        # Optionally a comma at the end
        `,
        "g"
    );

    /**
     * Labels are matched inside the 'label' capture
     */
    export const label = xre(`
        ^                                       # Match start of line
        (?<label>(${identifierFrag}|\\d+))      # Grab identifier
        :                                       # Must be followed by :
    `);

    /**
     * We capture function name to 'funcid'
     * and the arguments to 'args'
     * 'open' if present means that the function has a body
     */
    export const define = xre(`
        ^define.*                       # Line must start with 'define'
        (?<funcid>${globalVarFrag})     # Capture function name in 'funcid'
        \\(                             # Match open parenthesis for arguments
            (?<args>.*)                 # Grab in 'args' everything contained within greedily
        \\)                             # Match the close parenthesis
        .*                              # We dont care what follows
        ((?<open>\\{)|)                 # Does the declaration have a body?
                                        # if there is a { it is in the 'open' capture
        \\s*$                           # after the { there should be only whitespace
    `);

    /**
     * Capture declarations, ignoring arguments
     */
    export const declare = xre(`
        ^declare.*                      # Line starts with declare
        (?<funcid>${globalVarFrag})     # Grab identifier
        \\(.*\\).*$                     # There needs to be the '(' to avoid the identifier
                                        # Being included in the '.*'
    `);

    /**
     * Match the closing bracket of a function body
     */
    export const close = new RegExp("^\\s*}\\s*$");
}

/**
 * Given a string returns the string with
 * comments (from # onward) removed and the line trimmed
 * @param input input string
 * @returns cleaned string
 */
function xstr(input: string): string {
    let res = "";
    input.split("\n").forEach((line) => {
        res += line.split("#", 2)[0].trim();
    });
    return res;
}

/**
 * Same as xstr but compile to regex instead
 * @param input input string
 * @param flags? regex flags as in RegExp
 * @returns compiled regex
 */
function xre(input: string, flags?: string | undefined): RegExp {
    return new RegExp(xstr(input), flags);
}
