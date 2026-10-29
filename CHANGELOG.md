# Changelog

## 0.1.0

First release: 29 pure array nodes (category Array), all `objectutils/<Kind>@1`.

- Query: Index Of, Contains, First, Last, Is Empty, Count Of, Index Of Field, Get, Length.
- Build and change (each returns a new array): Slice, Append, Concat, Reverse, Unique, Insert, Remove At, Remove Value, Range, Repeat, Sort, Shuffle, Sort By Field.
- Convert: Join.
- Numbers: Sum, Average, Min Of, Max Of.
- Arrays of objects: Pluck Field, Filter By Field.

Items are compared with `===`. Range and Repeat cap their result at 1000 items.
