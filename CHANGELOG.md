# Changelog

## 0.2.3

Titles only (kinds, pins and templates are unchanged): the array nodes whose title clashed with another pack in the node picker now start with "Array": Array Concat, Array Join, Array Contains, Array Index Of, Array Is Empty, Array Repeat, Array Reverse.

## 0.2.2

Supports any Inkwell from 0.5.0 on (compatible.tool is now >=0.5.0 instead of ^0.x). No node, pin, field or template changed.

## 0.2.1

Every node now has an Inspector description. No pin, field or template changed.

## 0.2.0

Six new pure nodes for objects (category Object), all `objectutils/<Kind>@1`: Has Field, Keys, Values, Merge, Remove Field and Clone. Each returns a new value and leaves its input alone. Keys and Values come back in sorted key order (Flash 8 `for..in` order is not reliable); Values follow that order. Merge copies `a`, then `b` (`b` wins). Clone is shallow. A wire that is not an object (an array counts as not an object) is treated as `{}`. No existing node changed.

## 0.1.0

First release: 29 pure array nodes (category Array), all `objectutils/<Kind>@1`.

- Query: Index Of, Contains, First, Last, Is Empty, Count Of, Index Of Field, Get, Length.
- Build and change (each returns a new array): Slice, Append, Concat, Reverse, Unique, Insert, Remove At, Remove Value, Range, Repeat, Sort, Shuffle, Sort By Field.
- Convert: Join.
- Numbers: Sum, Average, Min Of, Max Of.
- Arrays of objects: Pluck Field, Filter By Field.

Items are compared with `===`. Range and Repeat cap their result at 1000 items.
