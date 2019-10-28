const SortedItems = Symbol("SortedItems")
const SortedKeys = Symbol("SortedKeys")
const Unsorted = Symbol("Unsorted")

class DedupeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DedupeError'
  }
}

function dedupe(strategy, items, key_cache, key_mapper = item => item.id) {
  const isArray = Array.isArray(items)
  if (!isArray) {
    items = [items]
  }

  const current_keys = items.map(item => {
    const key = key_mapper(item)
    const type = typeof key
    if (type == "string") {
      if (key.length > 64) {
        console.error(`Key too long: ${item} was mapped to ${key}`)
        throw new DedupeError("Dedup error, check logs")
      }
    } else if (type != "number") {
      console.error(`Key was an illegal type (type): ${item} was mapped to ${key}`)
      throw new DedupeError("Dedup error, check logs")
    }
    return key
  })


  // deal with the degenerate cases
  if (!key_cache || !Array.isArray(key_cache)) {
    key_cache = current_keys
    items = []
  } else if (key_cache.length == 0) {
    key_cache = current_keys
  } else if (strategy == SortedKeys) {
    key_cache = key_cache.concat(current_keys)
    items = items.filter(
      (_obj, index) => current_keys[index] > key_cache[0]
    )
  } else if (strategy == SortedItems) {
    const index = current_keys.findIndex(key => key == key_cache[0])
    if (index > -1) items = items.slice(0, index)
    key_cache = current_keys
  } else {
    // strategy UNSORTED
    const key_map = key_cache.reduce(
      (acc, obj) => {acc[obj] = true; return acc},
      {}
    )
    const undropped_keys = []

    // NB: filter with a side-effect
    items = items.filter((_obj, index) => {
      if (!(current_keys[index] in key_map)) {
        undropped_keys.push(current_keys[index])
        return true
      }
    })

    // TODO: heuristic on add order
    key_cache = undropped_keys.concat(key_cache)
  }

  // Filter down the key cache if necessary (we do it here instead of above
  // to handle the degenerate cases correctly)
  if (key_cache.length > 0) {
    switch (strategy) {
      case SortedKeys:
        key_cache = [
          key_cache.reduce(
            (acc, obj) => (obj > acc ? obj : acc),
            key_cache[0]
          ),
        ]
        break
      case SortedItems:
        key_cache = key_cache.slice(0, 1)
        break
      case Unsorted:
        key_cache = key_cache.slice(0, 1000)
        break
    }
  }

  // unwrap if necessary
  if (!isArray) {
    items = items[0]
  }

  return {items, key_cache}
}

module.exports = {
  SortedItems, SortedKeys, Unsorted, dedupe
}
