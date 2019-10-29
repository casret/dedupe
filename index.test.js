const {Strategies, dedupe} = require("./index")

describe("SortedItems strategy", () => {
  test("should drop any key to the right of the pivot and update key_cache", () => {
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], { strategy: Strategies.SortedItems, key_cache: ["b"]})
    expect(items).toEqual([{id: "a"}])
    expect(key_cache).toEqual(["a"])
  })

  test("should drop all keys if pivot is the key_cache", () => {
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], { strategy: Strategies.SortedItems, key_cache: ["a"]})
    expect(items).toEqual([])
    expect(key_cache).toEqual(["a"])
  })
  test("should keep all keys and update key_cache if pivot doesn't match", () => {
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], { strategy: Strategies.SortedItems, key_cache: ["d"]})
    expect(items).toEqual([{id: "a"}, {id: "b"}, {id: "c"}])
    expect(key_cache).toEqual(["a"])
  })
})

describe("SortedKeys strategy", () => {
  test("should drop any key less then pivot", () => {
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], {strategy: Strategies.SortedKeys, key_cache: ["b"]})
    expect(items).toEqual([{id: "c"}])
    expect(key_cache).toEqual(["c"])
  })
})

describe("Unsorted strategy", () => {
  test("should drop any key it has seen before", () => {
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], {strategy: Strategies.Unsorted, key_cache: ["b"]})
    expect(items).toEqual([{id: "a"}, {id: "c"}])
    expect(key_cache).toEqual(["a","c", "b"])
  })
  test("should reverse the key cache insertion order if it notices that it drops items from the left", () => {
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], {strategy: Strategies.Unsorted, key_cache: ["a"]})
    expect(items).toEqual([{id: "b"}, {id: "c"}])
    expect(key_cache).toEqual(["c", "b", "a"])
  })
})

describe("When using auto_checkpoint", () => {
  test("should use $checkpoint as the key_cache", () => {
    const checkpointer = { $checkpoint: ["b"] }
    const { items, key_cache } = dedupe([{id: "a"}, {id: "b"}, {id:"c"}], {auto_checkpoint: checkpointer})
    expect(items).toEqual([{id: "a"}])
    expect(key_cache).toEqual(["a"])
  })

  test("should update $checkpoint", () => {
    const checkpointer = { $checkpoint: ["b"] }
    dedupe([{id: "a"}, {id: "b"}, {id:"c"}], {auto_checkpoint: checkpointer})
    expect(checkpointer.$checkpoint).toEqual(["a"])
  })
})

describe("When passing in your own key mapper", () => {
  test("should use it", () => {
    const { items, key_cache } = dedupe([{id: "a", sec: 3}, {id: "b", sec:2}, {id:"c", sec:1}], {strategy: Strategies.SortedKeys, key_cache: [2], key_mapper: item => item.sec})
    expect(items).toEqual([{id: "a", sec:3}])
    expect(key_cache).toEqual([3])
  })
})
