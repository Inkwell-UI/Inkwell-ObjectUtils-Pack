# ObjectUtils

An Inkwell node pack with 29 array utilities (Index Of, Get, Slice, Unique, Sort, Shuffle, Sum, Pluck Field, Filter By Field and more; category Array) and 6 object utilities (Has Field, Keys, Values, Merge, Remove Field, Clone; category Object), all pure nodes. Pack id `objectutils`; nodes are `objectutils/<Kind>@1`. See `CHANGELOG.md` for the list.

```
manifest.json        pack id, version, compatible tool range
nodes/<Kind>.json    one node definition per file
templates/<Kind>.as2 the AS2 each node generates (one expression)
test/                node --test: templates agree with their pins, and every node has known-answer cases
```

Commands (Inkwell-Core-Pack and Inkwell-Spec checked out next to this folder; run `yarn build` in Inkwell-Spec once): `yarn install`, `yarn validate`, `yarn test`.

Add it in the editor with Assets > Node packs > Add Pack and `Inkwell-UI/Inkwell-ObjectUtils-Pack`. Release: bump `version` in `manifest.json`, add a `CHANGELOG.md` entry, push the tag `v<version>`.

Behaviour worth knowing:

- Nodes never change the array they are given; the ones that "change" an array return a new one. A wire that is not an array counts as an empty array.
- Items are compared strictly (`===`): the number `1` and the text `"1"` are different. Set the node's `valueType` field to the type of the item pin, as on Core's Array Get and Array Push.
- Negative indexes count from the end (Get, Slice, Insert, Remove At). An index that is out of range gives the `default` (Get), no change (Remove At) or the nearest end (Insert).
- Slice takes a start and a `count`; a negative count means "to the end".
- Range and Repeat cap their result at 1000 items. Average, Min Of and Max Of of an empty array are 0; non-numeric items count as 0 in Sum, Average, Min Of and Max Of.
- Sort and Sort By Field compare numbers numerically and everything else as text. Shuffle is random on every evaluation.
- Flash 8 arrays have no `indexOf`, `filter` or `map`, so the templates loop by hand.
- The object nodes return a new object and never change the one they are given. A wire that is not an object counts as `{}`. Keys and Values are in sorted key order; Merge lets `b` win; Clone is shallow (nested objects and arrays are shared).
