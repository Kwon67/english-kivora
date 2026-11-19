/** Verify every MPEG-1 Layer III frame for the requested mp3_44100_128 profile. */
export function mp3Duration(bytes: Buffer) {
  let offset = 0
  if (bytes.subarray(0, 3).toString() === 'ID3') {
    const size = bytes.subarray(6, 10)
    if (size.length !== 4 || size.some((n) => n >= 128)) throw Error('Tag ID3 inválida.')
    offset = 10 + size.reduce((n, part) => n * 128 + part, 0)
    if (bytes[3] === 4 && bytes[5] & 16) offset += 10
  }
  let frames = 0
  while (offset < bytes.length) {
    if (bytes.length - offset === 128 && bytes.toString('ascii', offset, offset + 3) === 'TAG') break
    if (
      offset + 4 > bytes.length ||
      bytes[offset] !== 255 ||
      (bytes[offset + 1] & 254) !== 250 ||
      (bytes[offset + 2] & 252) !== 144
    )
      throw Error('Formato inesperado no MP3.')
    offset += 417 + ((bytes[offset + 2] >> 1) & 1)
    if (offset > bytes.length) throw Error('Último quadro MP3 incompleto.')
    frames++
  }
  if (frames < 2) throw Error('MP3 sem duração válida.')
  return (frames * 1152) / 44100
}
