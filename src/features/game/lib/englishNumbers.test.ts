import { describe, expect, it } from 'vitest'
import { scoreSpeechTranscript } from './speech-scoring'
import { matchEnglishAnswer } from './englishAnswerMatching'

describe('contextual numbers from speech recognition', () => {
  it.each([
    ['The hotel costs one hundred twenty dollars.', 'The hotel costs 120 dollars.'],
    ['We need one hundred and twenty chairs.', 'We need 120 chairs.'],
    ['There are two thousand three hundred forty-five seats.', 'There are 2,345 seats.'],
    ['One million two hundred thousand people live here.', '1,200,000 people live here.'],
    ['We meet on the twenty-first.', 'We meet on the 21st.'],
    ['It is the thirty-first of May.', 'It is the 31st of May.'],
    ['This is her one hundredth visit.', 'This is her 100th visit.'],
    ['It is two point five kilometers away.', 'It is 2.5 kilometers away.'],
    ['The result is zero point zero five.', 'The result is 0.05.'],
    ['My phone number ends in two zero six.', 'My phone number ends in 206.'],
    ['The soup costs four dollars and fifty cents.', 'The soup costs $4.50.'],
    ['The shop opens at eight thirty.', 'The shop opens at 8:30.'],
    ['I need twenty-one tickets.', 'I need 21 tickets.'],
    ['The recipe needs one and a half cups of milk.', 'The recipe needs 1.5 cups of milk.'],
    ['We need half a kilo of rice.', 'We need 0.5 kilo of rice.'],
    ['Add a quarter of a cup of water.', 'Add 0.25 cup of water.'],
    ['We meet at a quarter past nine.', 'We meet at 9:15.'],
    ['We meet at a quarter to ten.', 'We meet at 9:45.'],
    ['My birthday is on February second.', 'My birthday is on February 2.'],
  ])('accepts equivalent representations: %s', (expected, recognized) => {
    expect(scoreSpeechTranscript(expected, recognized).accepted).toBe(true)
    expect(matchEnglishAnswer(recognized, expected)).toBe('exact')
  })

  it.each([
    ['I need thirteen tickets.', 'I need thirty tickets.'],
    ['We meet on the first.', 'We meet on the one.'],
    ['It costs one hundred twenty dollars.', 'It costs 102 dollars.'],
    ['It is two point five kilometers away.', 'It is 25 kilometers away.'],
    ['Choose two, three or four.', 'Choose 23 or four.'],
    ['The numbers are twenty, three and four.', 'The numbers are 23 and four.'],
    ['The train leaves at eight thirty.', 'The train leaves at 8:13.'],
    ['We need one and a half cups.', 'We need 15 cups.'],
    ['We meet at a quarter to ten.', 'We meet at 10:15.'],
    ['My birthday is on February second.', 'My birthday is on February 3.'],
    ['The population is one hundred thousand.', 'The population is 100001.'],
    ['This is my one hundredth visit.', 'This is my 101st visit.'],
  ])('rejects different numeric meaning: %s', (expected, recognized) => {
    expect(scoreSpeechTranscript(expected, recognized).accepted).toBe(false)
    expect(matchEnglishAnswer(recognized, expected)).toBe('wrong')
  })
})
