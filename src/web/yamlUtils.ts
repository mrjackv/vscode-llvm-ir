import { Kind, YamlMap, YAMLNode } from "yaml-ast-parser";

export namespace YamlASTVisitor {
    export function walk(node: YAMLNode) {
        switch (node.kind) {
            case Kind.MAP:
                handleMap(node as YamlMap);
        }
    }

    function handleMap(map: YamlMap) {
        map.mappings.forEach((m) => console.log(m.key));
    }
}
