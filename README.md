# dedupe
Dedupe utility functions for pipedream

## Usage
```
const {dedupe, Strategies} = require ("@casret/dedupe")

return dudupe(steps.foo.$return_value, {auto_checkpoint: this}).items
```

## API

### dedupe(items, opts)

Returns an object with `items' and `key_cache' fields, which are the deduped items
and updated key_cache based on a strategy and key_cache that are passed in.

#### items

Type: Array | object

The array or item you want to check against the key_cache.  If array is passed in, and array (
possibly empty or singular) will be returned, if an object is passed in, that object or null
will be passed back (under the `items`).

#### opts

Type: object

Options to configure the dedupe action

##### strategy

Type: symbol

One of the symbols from the Strategies object

- `Strategies.SortedItems` - the default strategy, this assumes that items passed in are already sorted from most recent to oldest.  The key_cache will store the most recent key, and filter that item and any following.  This is storage efficient as long as the source of data that is sorted and does not delete any data.
- `Strategies.SortedKeys` - This strategy assumes will filter any items that are less or equal to the key_cache and update the key_cache.  The items do not have to be sorted. This is a great strategy when you have a monotonicly increasing key (e.g. high resolution timestamp, or database id).
- `Strategies.Unsorted` - This strategy will cache and filter out the last 1000 keys it has seen.  While this works for data without much structure, obvivously has drawbacks if you need deal with large or high volume datasets.

##### key_mapper

Type: function

This function maps the items to a key that uniquely identifies the item.  It defaults to `(item) => item.id`.  A key should be a number or a string of length of 64 or less.

##### key_cache

Type: Array

Specifies the key_cache from the previous run.  If it's `undefined`, then all items are filtered and cached in accordance to the Strategy.  If it's empty (`[]`), then all items are passed back, and cached in accordance to the Strategy.  To provide that consistent API, key_cache will always be an array, even if a strategy uses only a single key.

##### auto_checkpoint

Type: object

If you pass in the pipedream `this` from a step, it will use the `this.$checkpoint` as the key_cache, and update it automatically.  This means that the deduper should be the only code that is using `this.$checkpoint` in that step
