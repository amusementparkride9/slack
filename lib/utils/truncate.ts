export const truncate = (text: string, maxLength: number, splitAtSpace = true) => {
  if (text.length <= maxLength) {
    return text
  }
  
  if (splitAtSpace) {
    const lastSpace = text.substring(0, maxLength).lastIndexOf(' ')
    if (lastSpace !== -1) {
      return text.substring(0, lastSpace) + '...'
    }
  }
  
  return text.substring(0, maxLength) + '...'
}