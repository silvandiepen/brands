import { deflateRawSync } from 'node:zlib'
import { createHash } from 'node:crypto'

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]!
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

const FIXED_TIME = 0
const ZIP_VERSION = 20

export interface ZipEntry {
  path: string
  data: Buffer
}

export function createZip(entries: ZipEntry[]): Buffer {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path))
  const chunks: Buffer[] = []
  const centralDir: Buffer[] = []
  let offset = 0

  for (const entry of sorted) {
    const compressed = deflateRawSync(entry.data, { level: 9 })
    const crc = crc32(entry.data)

    const nameBuf = Buffer.from(entry.path, 'utf8')

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(ZIP_VERSION, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(8, 8)
    localHeader.writeUInt16LE(FIXED_TIME, 10)
    localHeader.writeUInt16LE(FIXED_TIME, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compressed.length, 18)
    localHeader.writeUInt32LE(entry.data.length, 22)
    localHeader.writeUInt16LE(nameBuf.length, 26)
    localHeader.writeUInt16LE(0, 28)

    chunks.push(localHeader, nameBuf, compressed)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(ZIP_VERSION, 4)
    centralHeader.writeUInt16LE(ZIP_VERSION, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(8, 10)
    centralHeader.writeUInt16LE(FIXED_TIME, 12)
    centralHeader.writeUInt16LE(FIXED_TIME, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(compressed.length, 20)
    centralHeader.writeUInt32LE(entry.data.length, 24)
    centralHeader.writeUInt16LE(nameBuf.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)

    centralDir.push(centralHeader, nameBuf)

    offset += localHeader.length + nameBuf.length + compressed.length
  }

  const centralDirBuffer = Buffer.concat(centralDir)
  const endRecord = Buffer.alloc(22)
  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(0, 4)
  endRecord.writeUInt16LE(0, 6)
  endRecord.writeUInt16LE(sorted.length, 8)
  endRecord.writeUInt16LE(sorted.length, 10)
  endRecord.writeUInt32LE(centralDirBuffer.length, 12)
  endRecord.writeUInt32LE(offset, 16)
  endRecord.writeUInt16LE(0, 20)

  return Buffer.concat([...chunks, centralDirBuffer, endRecord])
}
