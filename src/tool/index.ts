import { Modifier } from "obsidian"


function debounce(delay: number = 100): MethodDecorator {
  let lastTime = 0
  let timer: NodeJS.Timeout

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const now = Date.now()
      clearTimeout(timer)

      if ((now - lastTime) < delay) {
        return
      }

      timer = setTimeout(() => {
        originalMethod.apply(this, args)
        lastTime = 0
      }, delay)

      lastTime = now
    }

    return descriptor
  }
}


function calcDistance(a: M.Position, b: M.Position) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2
  )
}

function findClosestNodeByBbox(pos: M.Position, nodes: M.Node[]): { node: M.Node, distance: number } {
  return nodes.reduce((prev, cur, idx) => {
    const a: M.Position = [cur.bbox.minX, cur.bbox.minY]
    const b: M.Position = [cur.bbox.maxX, cur.bbox.minY]
    const c: M.Position = [cur.bbox.minX, cur.bbox.maxY]
    const d: M.Position = [cur.bbox.maxX, cur.bbox.maxY]
    // todo: at least two or more point in each node can be ignored
    const distance = Math.min(
      calcDistance(pos, a),
      calcDistance(pos, b),
      calcDistance(pos, c),
      calcDistance(pos, d),
    )

    if (idx === 0) {
      return {
        node: cur,
        distance: distance,
      }
    }

    return distance < prev.distance
      ? {node: cur, distance}
      : prev

  }, {
    node: {} as any,
    distance: 0,
  })
}

/**
 * Create a 64-bit random number of lengths 12
 */
function uuid() {
  const first = Math.floor(Math.random() * 9 + 1)
  const rest = String(Math.random()).slice(2, 10)
  const random9 = first + rest

 return string10To64(Date.now()) + string10To64(random9)
}

function string10To64(str: number | string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const radix = chars.length
  let num = typeof str === 'string' ? parseInt(str) : str
  const res = []

  do {
    const mod = num % radix
    res.push(chars[mod])
    num = (num - mod) / radix
  } while (num > 0)

  return res.join('')
}

const supportedModifiers = ['mod', 'ctrl', 'meta', 'shift', 'alt']
const navigationKeys = ['tab', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', /** 'backspace', 'delete', 'escape', 'space' */]

/** 
 * Converts a hotkey string into an array of modifiers and a key.
 *
 * The hotkey string is expected to contain either a single alphanumeric character,
 * or one or more modifiers followed by '+' and an alphanumeric character.
 *
 * @param hotkey - The hotkey string to be converted.
 *                 Example formats:
 *                 - 'A'
 *                 - 'Ctrl+A'
 *                 - 'Ctrl+Shift+A'
 * @returns A tuple where the first element is an array of modifier strings,
 *          and the second element is the main key string.
 * @throws Error if the hotkey format is invalid.
 */
function convertHotkey2Array(hotkey: string): [Modifier[], string] {
  const parts = hotkey.split('+');
  let modifier: Modifier | null = null
  let key: string | null = null

  if (parts.length === 1) {
    key = parts[0].trim()
    if (!navigationKeys.includes(key.toLocaleLowerCase()) && !/^[a-zA-Z0-9]$/.test(key)) {
      throw new Error('Invalid key. Expected a single alphanumeric character or a navigation key but got ' + key);
    }
    return [[], key]
  } else if (parts.length === 2) {
    modifier = parts[0].trim() as Modifier
    if (!supportedModifiers.includes(modifier.toLocaleLowerCase())) {
      throw new Error(`Invalid modifier. Expected [${supportedModifiers.join(', ')}].`);
    }
    key = parts[1].trim()
    if (!navigationKeys.includes(key.toLocaleLowerCase()) && !/^[a-zA-Z0-9]$/.test(key)) {
      throw new Error('Invalid key. Expected a single alphanumeric character or a navigation key but got ' + key);
    }
    // @ts-ignore
    return [[modifier.charAt(0).toUpperCase() + modifier.slice(1)], key]
  }

  throw new Error('Invalid hotkey format. Expected a single alphanumeric character or a modifier followed by a single alphanumeric character but got ' + hotkey);
}

function convertHotkey2String(hotkey: [Modifier[], string]): string {
  return hotkey.join('+')
}

export { debounce, calcDistance, findClosestNodeByBbox, uuid, convertHotkey2Array, convertHotkey2String }
