// Checks every template against its node definition, then evaluates each rendered expression in JS (the expressions are
// valid in both JS and AS2) against known answers. Uses the Core Pack's test renderer: inputs become IN_<pin>.
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPack, checkTemplate, render, fixtureFields } from "@inkwell-ui/core-pack/scripts/lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { manifest, nodes } = loadPack(root);
const byKind = Object.fromEntries(nodes.map((n) => [n.def.kind, n]));

test("every template agrees with its pins and fields", () => {
  for (const n of nodes) assert.deepEqual(checkTemplate(n.def, n.text, manifest.id), [], n.id);
});

const OBJECT_KINDS = ["HasField", "Keys", "Values", "Merge", "RemoveField", "Clone"];

test("every node is pure with one 'value' output; the six object nodes are in category Object, the rest in Array", () => {
  assert.equal(nodes.length, 35);
  for (const n of nodes) {
    assert.equal(n.def.pure, true, n.id);
    assert.equal(n.def.category, OBJECT_KINDS.includes(n.def.kind) ? "Object" : "Array", n.id);
    assert.deepEqual(n.def.outputs.map((o) => o.name), ["value"], n.id);
  }
});

// Flash 8 AS2 arrays have no indexOf/filter/map/forEach; the templates must loop by hand.
test("templates avoid AS3-only Array methods", () => {
  for (const n of nodes) assert.doesNotMatch(n.text, /\.(indexOf|filter|map|forEach|some|every|reduce)\(/, n.id);
});

// run(kind, inputs, fields): render the template, bind the inputs and evaluate the expression line.
const run = (kind, inputs, fields = {}) => {
  const { def, text } = byKind[kind];
  const expr = render(def, text, { ...fixtureFields(def), ...fields }).split("\n")[1];
  const names = def.inputs.map((p) => p.name);
  return new Function(...names.map((n) => "IN_" + n), `return ${expr};`)(...names.map((n) => inputs[n] ?? def.inputs.find((p) => p.name === n).default));
};

const objs = [{ id: 1, name: "b", w: 3 }, { id: 2, name: "a", w: 1 }, { id: 3, name: "c", w: 2 }];
const num = { valueType: "Number" };

const cases = [
  ["IndexOf", { array: ["a", "b", "a"], value: "a" }, {}, 0],
  ["IndexOf", { array: ["a", "b"], value: "z" }, {}, -1],
  ["IndexOf", { array: [1, 2, 3], value: 3 }, num, 2],
  ["IndexOf", { array: "nope", value: "a" }, {}, -1],
  ["Contains", { array: [1, 2, 3], value: 2 }, num, true],
  ["Contains", { array: [1, 2, 3], value: 9 }, num, false],
  ["First", { array: ["x", "y"] }, {}, "x"],
  ["First", { array: [] }, {}, ""],
  ["First", { array: [] }, num, 0],
  ["Last", { array: [4, 5, 6] }, num, 6],
  ["Last", { array: [] }, { valueType: "Bool" }, false],
  ["IsEmpty", { array: [] }, {}, true],
  ["IsEmpty", { array: [0] }, {}, false],
  ["CountOf", { array: [1, 2, 1, 1], value: 1 }, num, 3],
  ["IndexOfField", { array: objs, field: "name", value: "a" }, {}, 1],
  ["IndexOfField", { array: objs, field: "id", value: 3 }, num, 2],
  ["IndexOfField", { array: [null, { id: 1 }], field: "id", value: 1 }, num, 1],
  ["IndexOfField", { array: objs, field: "name", value: "zz" }, {}, -1],
  ["Get", { array: ["a", "b", "c"], index: 1 }, {}, "b"],
  ["Get", { array: ["a", "b", "c"], index: -1 }, {}, "c"],
  ["Get", { array: ["a", "b", "c"], index: 3, default: "d" }, {}, "d"],
  ["Get", { array: ["a", "b", "c"], index: -4, default: "d" }, {}, "d"],
  ["Get", { array: [5], index: 0 }, num, 5],
  ["Get", { array: [], index: 0 }, num, 0],
  ["Length", { array: [1, 2, 3] }, {}, 3],
  ["Length", { array: undefined }, {}, 0],
  ["Slice", { array: [1, 2, 3, 4], start: 1 }, {}, [2, 3, 4]],
  ["Slice", { array: [1, 2, 3, 4], start: 1, count: 2 }, {}, [2, 3]],
  ["Slice", { array: [1, 2, 3, 4], start: -2 }, {}, [3, 4]],
  ["Slice", { array: [1, 2, 3, 4], start: -9, count: 1 }, {}, [1]],
  ["Slice", { array: [1, 2, 3, 4], start: 1, count: 0 }, {}, []],
  ["Append", { array: [1], item: 2 }, num, [1, 2]],
  ["Concat", { array: [1], other: [2, 3] }, {}, [1, 2, 3]],
  ["Concat", { array: [1], other: "x" }, {}, [1]],
  ["Reverse", { array: [1, 2, 3] }, {}, [3, 2, 1]],
  ["Unique", { array: [1, 2, 1, 3, 2] }, {}, [1, 2, 3]],
  ["Unique", { array: [1, "1"] }, {}, [1, "1"]],
  ["Insert", { array: [1, 3], index: 1, item: 2 }, num, [1, 2, 3]],
  ["Insert", { array: [1, 2], index: 99, item: 3 }, num, [1, 2, 3]],
  ["Insert", { array: [1, 2], index: -1, item: 9 }, num, [1, 9, 2]],
  ["Insert", { array: [1, 2], index: -99, item: 0 }, num, [0, 1, 2]],
  ["RemoveAt", { array: [1, 2, 3], index: 1 }, {}, [1, 3]],
  ["RemoveAt", { array: [1, 2, 3], index: -1 }, {}, [1, 2]],
  ["RemoveAt", { array: [1, 2, 3], index: 5 }, {}, [1, 2, 3]],
  ["RemoveValue", { array: [1, 2, 1, 3], value: 1 }, num, [2, 3]],
  ["Range", { start: 2, count: 3 }, {}, [2, 3, 4]],
  ["Range", { start: 10, count: 3, step: -5 }, {}, [10, 5, 0]],
  ["Range", { start: 0, count: -3 }, {}, []],
  ["Range", { start: 0, count: 5000 }, {}, 1000],
  ["Repeat", { item: "x", count: 3 }, {}, ["x", "x", "x"]],
  ["Repeat", { item: "x", count: -1 }, {}, []],
  ["Sort", { array: [10, 9, 100, 1] }, {}, [1, 9, 10, 100]],
  ["Sort", { array: [10, 9, 100, 1], descending: true }, {}, [100, 10, 9, 1]],
  ["Sort", { array: ["b", "c", "a"] }, {}, ["a", "b", "c"]],
  ["Join", { array: [1, 2, 3], separator: "-" }, {}, "1-2-3"],
  ["Join", { array: [], separator: "-" }, {}, ""],
  ["Join", { array: "nope" }, {}, ""],
  ["SortByField", { array: objs, field: "w" }, {}, [objs[1], objs[2], objs[0]]],
  ["SortByField", { array: objs, field: "name", descending: true }, {}, [objs[2], objs[0], objs[1]]],
  ["Sum", { array: [1, 2, 3.5] }, {}, 6.5],
  ["Sum", { array: [1, "x", "4"] }, {}, 5],
  ["Sum", { array: [] }, {}, 0],
  ["Average", { array: [1, 2, 6] }, {}, 3],
  ["Average", { array: [] }, {}, 0],
  ["MinOf", { array: [3, -2, 8] }, {}, -2],
  ["MinOf", { array: [] }, {}, 0],
  ["MaxOf", { array: [3, -2, 8] }, {}, 8],
  ["MaxOf", { array: [-5, -2] }, {}, -2],
  ["PluckField", { array: objs, field: "name" }, {}, ["b", "a", "c"]],
  ["PluckField", { array: [null, { name: "x" }], field: "name" }, {}, [undefined, "x"]],
  ["FilterByField", { array: objs, field: "w", value: 2 }, num, [objs[2]]],
  ["FilterByField", { array: objs, field: "w", value: 9 }, num, []],
];

for (const [kind, inputs, fields, want] of cases) {
  test(`${kind} ${JSON.stringify(inputs)} ${JSON.stringify(fields)}`, () => {
    const got = run(kind, inputs, fields);
    // the Range cap case states the expected length instead of the whole array
    if (kind === "Range" && typeof want === "number") return assert.equal(got.length, want);
    assert.deepEqual(got, want);
  });
}

test("nodes that change an array leave their input alone", () => {
  const src = [3, 1, 2];
  for (const [kind, extra] of [["Reverse", {}], ["Sort", {}], ["Shuffle", {}], ["Append", { item: 9 }], ["Insert", { index: 0, item: 9 }], ["RemoveAt", { index: 0 }], ["Concat", { other: [4] }]]) {
    run(kind, { array: src, ...extra }, num);
    assert.deepEqual(src, [3, 1, 2], kind);
  }
});

test("Shuffle keeps the same items", () => {
  const got = run("Shuffle", { array: [1, 2, 3, 4, 5, 6] });
  assert.deepEqual([...got].sort(), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(run("Shuffle", { array: [] }), []);
});

const rec = { b: 1, a: 2 };
const objCases = [
  ["HasField", { object: { a: 1 }, key: "a" }, true],
  ["HasField", { object: { a: 1 }, key: "b" }, false],
  ["HasField", { object: [1], key: "0" }, false],
  ["HasField", { object: null, key: "a" }, false],
  ["Keys", { object: rec }, ["a", "b"]],
  ["Keys", { object: {} }, []],
  ["Keys", { object: "nope" }, []],
  ["Values", { object: rec }, [2, 1]],
  ["Values", { object: [5] }, []],
  ["Merge", { a: { a: 1, b: 2 }, b: { b: 3, c: 4 } }, { a: 1, b: 3, c: 4 }],
  ["Merge", { a: { a: 1 }, b: "nope" }, { a: 1 }],
  ["RemoveField", { object: { a: 1, b: 2 }, key: "a" }, { b: 2 }],
  ["RemoveField", { object: { a: 1 }, key: "zz" }, { a: 1 }],
  ["Clone", { object: { a: 1, b: [2] } }, { a: 1, b: [2] }],
  ["Clone", { object: [1] }, {}],
];

for (const [kind, inputs, want] of objCases) {
  test(`${kind} ${JSON.stringify(inputs)}`, () => assert.deepEqual(run(kind, inputs), want));
}

test("object nodes leave their input alone", () => {
  const src = { b: 1, a: 2 };
  for (const [kind, extra] of [["Merge", { b: { z: 9 } }], ["RemoveField", { key: "a" }], ["Clone", {}], ["Keys", {}], ["Values", {}]]) {
    run(kind, { object: src, a: src, ...extra });
    assert.deepEqual(src, { b: 1, a: 2 }, kind);
  }
  const copy = run("Clone", { object: src });
  copy.a = 99;
  assert.equal(src.a, 2);
});
