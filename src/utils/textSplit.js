/**
 * Split text into words wrapped in spans for animation
 * @param {string} text - The text to split
 * @returns {Array} Array of word objects with text and key
 */
export const splitTextToWords = (text) => {
  if (!text) return []
  
  return text.split(' ').map((word, index) => ({
    text: word,
    key: `word-${index}`,
  }))
}

/**
 * Component helper to render split text
 */
export const SplitText = ({ children, className = '' }) => {
  const words = splitTextToWords(children)
  
  return (
    <>
      {words.map((word, index) => (
        <span key={word.key} className={`word ${className}`}>
          {word.text}
          {index < words.length - 1 && ' '}
        </span>
      ))}
    </>
  )
}
