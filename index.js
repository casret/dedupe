const Strategies = {
  SortedItems: Symbol("SortedItems"),
  SortedKeys: Symbol("SortedKeys"),
  Unsorted: Symbol("Unsorted"),
}

class DedupeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DedupeError'
  }
}

function dedupe(items, opts) {
  const strategy = opts.strategy || Strategies.SortedItems
  if (strategy !== Strategies.SortedItems &&
    strategy !== Strategies.SortedKeys &&
    strategy !== Strategies.Unsorted)
    throw new DedupeError("Unknown strategy passed")

  const key_mapper = opts.key_mapper || (item => item.id)
  let key_cache
  if (opts.auto_checkpoint) {
    key_cache = opts.auto_checkpoint.$checkpoint
  }

  // Allow overriding the auto_checkpoint if you want
  key_cache = opts.key_cache || key_cache

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
  } else if (strategy == Strategies.SortedKeys) {
    key_cache = key_cache.concat(current_keys)
    items = items.filter(
      (_obj, index) => current_keys[index] > key_cache[0]
    )
  } else if (strategy == Strategies.SortedItems) {
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

    // If current_keys[0] was already in the key_cache, it's more likely
    // that the array is sorted from oldest to youngest, so we'll reverse the order
    // of how we insert them
    if(undropped_keys.length > 0 && undropped_keys[0] != current_keys[0]) {
      undropped_keys.reverse()
    }

    key_cache = undropped_keys.concat(key_cache)
  }

  // Filter down the key cache if necessary (we do it here instead of above
  // to handle the degenerate cases correctly)
  if (key_cache.length > 0) {
    switch (strategy) {
      case Strategies.SortedKeys:
        key_cache = [
          key_cache.reduce(
            (acc, obj) => (obj > acc ? obj : acc),
            key_cache[0]
          ),
        ]
        break
      case Strategies.SortedItems:
        key_cache = key_cache.slice(0, 1)
        break
      case Strategies.Unsorted:
        key_cache = key_cache.slice(0, 1000)
        break
    }
  }

  // unwrap if necessary
  if (!isArray) {
    items = items[0]
  }

  if (opts.auto_checkpoint) {
    opts.auto_checkpoint.$checkpoint = key_cache
  }

  return {items, key_cache}
}

module.exports = {
  dedupe, Strategies
}
