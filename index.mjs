export const PREFERS_PADDING = 1
export const PREFERS_NO_PADDING = 2

export function make (name, charset, padding, paddingMode) {
  if (charset.length !== 64) {
    throw new Error(`Charset needs to be 64 characters long! (${charset.length})`)
  }
  const byCharCode = new Uint8Array(256)
  const byNum = new Uint8Array(64)
  for (let i = 0; i < 64; i += 1) {
    const code = charset.charCodeAt(i)
    if (code > 255) {
      throw new Error(`Character #${i} in charset [code=${code}, char=${charset.charAt(i)}] is too high! (max=255)`)
    }
    if (byCharCode[code] !== 0) {
      throw new Error(`Character [code=${code}, char=${charset.charAt(i)}] is more than once in the charset!`)
    }
    byCharCode[code] = i
    byNum[i] = code
  }
  const padCode = padding.charCodeAt(0)
  const codec = {
    name,
    encodingLength (str) {
      const strLen = str.length
      const len = strLen * 0.75 | 0
      if (str.charCodeAt(strLen - 1) === padCode) {
        if (str.charCodeAt(strLen - 2) === padCode) {
          return len - 2
        }
        return len - 1
      }
      return len
    },
    encode (str, buffer, offset) {
      if (buffer === null || buffer === undefined) {
        buffer = new Uint8Array(codec.encodingLength(str))
      }
      if (offset === null || offset === undefined) {
        offset = 0
      }

      let strLen = str.length
      if (str.charCodeAt(strLen - 1) === padCode) {
        if (str.charCodeAt(strLen - 2) === padCode) {
          strLen -= 2
        } else {
          strLen -= 1
        }
      }

      const padding = strLen % 4
      const safeLen = strLen - padding

      let off = offset
      let i = 0
      while (i < safeLen) {
        const code =
          (byCharCode[str.charCodeAt(i)] << 18) |
          (byCharCode[str.charCodeAt(i + 1)] << 12) |
          (byCharCode[str.charCodeAt(i + 2)] << 6) |
          byCharCode[str.charCodeAt(i + 3)]
        buffer[off++] = code >> 16
        buffer[off++] = code >> 8
        buffer[off++] = code
        i += 4
      }

      if (padding === 3) {
        const code =
          (byCharCode[str.charCodeAt(i)] << 10) |
          (byCharCode[str.charCodeAt(i + 1)] << 4) |
          (byCharCode[str.charCodeAt(i + 2)] >> 2)
        buffer[off++] = code >> 8
        buffer[off++] = code
      } else if (padding === 2) {
        buffer[off++] = (byCharCode[str.charCodeAt(i)] << 2) |
          (byCharCode[str.charCodeAt(i + 1)] >> 4)
      }

      codec.encode.bytes = off - offset
      return buffer
    },
    decode (buffer, start, end) {
      if (start === null || start === undefined) {
        start = 0
      }
      if (end === null || end === undefined) {
        end = buffer.length
      }

      const length = end - start
      const pad = length % 3
      const safeEnd = start + length - pad
      const codes = []
      for (let off = start; off < safeEnd; off += 3) {
        const num = (buffer[off] << 16) | ((buffer[off + 1] << 8)) | buffer[off + 2]
        codes.push(
          byNum[num >> 18 & 0x3F],
          byNum[num >> 12 & 0x3F],
          byNum[num >> 6 & 0x3F],
          byNum[num & 0x3F]
        )
      }

      if (pad === 2) {
        const num = (buffer[end - 2] << 8) + buffer[end - 1]
        codes.push(
          byNum[num >> 10],
          byNum[(num >> 4) & 0x3F],
          byNum[(num << 2) & 0x3F]
        )
        if (paddingMode === PREFERS_PADDING) {
          codes.push(padCode)
        }
      } else if (pad === 1) {
        const num = buffer[end - 1]
        codes.push(
          byNum[num >> 2],
          byNum[(num << 4) & 0x3F]
        )
        if (paddingMode === PREFERS_PADDING) {
          codes.push(padCode, padCode)
        }
      }

      codec.decode.bytes = length
      return String.fromCharCode.apply(String, codes)
    }
  }
  return codec
}

export const base64 = make('base64', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', '=', PREFERS_PADDING)
// https://datatracker.ietf.org/doc/html/rfc4648#section-5
export const base64URL = make('base64-url', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', '=', PREFERS_NO_PADDING)
