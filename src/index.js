// @ts-check

const { green, blue, gray } = require('colorette')
const { words, getCharsGrading } = require('./words')

const CHARS_GRADING = getCharsGrading()

class Word {
  /**
   * @param {string} text
   */
  constructor(text) {
    /**
     * @type {string[]}
     */
    this.characters = text.split('')
    /**
     * @type {string[]}
     */
    this.vowels = this.characters.filter((c) => 'aeiou'.includes(c))
    /**
     * @type {string[]}
     */
    this.consonants = this.characters.filter((c) => !'aeiou'.includes(c))
    /**
     * @type {Record<string, number>}
     */
    this.repeatedCharaters = this.characters
      .map((eachChar) => ({
        character: eachChar,
        count: this.characters.filter((c) => c === eachChar).length,
      }))
      .filter(({ count }) => count > 1)
      .reduce((acc, { character, count }) => Object.assign({}, acc, { [character]: count }), {})
  }

  /**
   *
   * @param {string} char
   * @returns {boolean}
   */
  hasChar(char) {
    return this.characters.includes(char)
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.characters.join('')
  }
}

class WordFilter {
  static COLORS = {
    GRAY: 0,
    YELLOW: 1,
    GREEN: 2,
  }
  /**
   * @param {{character: string, value: WordFilter.COLORS[keyof WordFilter.COLORS]}[]} positions
   */
  constructor(positions) {
    /**
     * @type {typeof positions}
     */
    this.positions = positions
  }

  /**
   * @param {Word} word
   */
  doesWordPass(word) {
    return this.doesWordPassGreen(word) && this.doesWordPassYellow(word) && this.doesWordPassGray(word)
  }

  /**
   * @param {Word} word
   */
  doesWordPassGreen(word) {
    return this.positions.every((position, i) => {
      if (position.value === WordFilter.COLORS.GREEN) {
        return word.characters[i] === position.character
      } else return true
    })
  }

  /**
   * @param {Word} word
   */
  doesWordPassYellow(word) {
    const print = Math.random() < 0.001
    return this.positions.every((position) => {
      if (position.value === WordFilter.COLORS.YELLOW) {
        const charIndex = word.characters.findIndex((c) => c === position.character)

        const wordHasCharacter = charIndex >= 0
        if (!wordHasCharacter) {
          print && console.log({ word: word.toString(), char: position.character, wordHasCharacter })
          return false
        }

        const positionAlreadyGreen = this.positions[charIndex].value === WordFilter.COLORS.GREEN
        print &&
          console.log({ word: word.toString(), char: position.character, wordHasCharacter, positionAlreadyGreen })
        return !positionAlreadyGreen
      } else return true
    })
  }

  /**
   * @param {Word} word
   */
  doesWordPassGray(word) {
    return this.positions.every((position, i) => {
      if (position.value === WordFilter.COLORS.GRAY) {
        return !word.characters.includes(position.character)
      } else return true
    })
  }

  /**
   * @returns {boolean}
   */
  get isWin() {
    return this.positions.every((p) => p.value === WordFilter.COLORS.GREEN)
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.positions
      .map((pos) => {
        return {
          [WordFilter.COLORS.GREEN]: green,
          [WordFilter.COLORS.YELLOW]: blue,
          [WordFilter.COLORS.GRAY]: gray,
        }[pos.value](pos.character)
      })
      .join('')
  }
}

class Game {
  /**
   * @param {string} secretWord
   * @param {string[]} allWords
   */
  constructor(secretWord, allWords) {
    /**
     * @type {WordFilter[]}
     */
    this.wordFilters = []
    /**
     * @type {Word}
     */
    this.secretWord = new Word(secretWord)
    /**
     * @type {Word[]}
     */
    this.allWords = allWords.map((word) => new Word(word))
    /**
     * @type {Word[]}
     */
    this.availableWords = allWords.map((word) => new Word(word))
  }

  /**
   * @param {Word} word
   * @returns {WordFilter}
   */
  newTry(word) {
    const wf = new WordFilter(
      word.characters.map((character, i) => {
        if (character === this.secretWord.characters[i]) return { character, value: WordFilter.COLORS.GREEN }
        else if (this.secretWord.characters.includes(character)) return { character, value: WordFilter.COLORS.YELLOW }
        else return { character, value: WordFilter.COLORS.GRAY }
      }),
    )
    word.characters.forEach((character, i) => {
      if (wf.positions[i].value === WordFilter.COLORS.YELLOW) {
        const greenChars = wf.positions
          .filter(({ value }) => value === WordFilter.COLORS.GREEN)
          .map(({ character }) => character)
        if (greenChars.includes(character)) {
          wf.positions[i] = { character, value: WordFilter.COLORS.GRAY }
        }
      }
    })

    return wf
  }

  /**
   * @returns {string[]}
   */
  get usedWords() {
    return this.wordFilters.map((wf) => wf.positions.map((p) => p.character).join(''))
  }

  /**
   * @return {string[]}
   */
  get greenChars() {
    const greenChars = [null, null, null, null, null]
    this.wordFilters.forEach((wf) => {
      wf.positions.forEach(({ character, value }, i) => {
        if (value === WordFilter.COLORS.GREEN) {
          greenChars[i] = character
        }
      })
    })
    return greenChars
  }

  /**
   * @return {string[]}
   */
  get yellowChars() {
    const allWordFilters = this.wordFilters.map((wf) => wf.positions).flat()
    const yellowChars = Array.from(
      new Set(
        allWordFilters.filter(({ value }) => value === WordFilter.COLORS.YELLOW).map(({ character }) => character),
      ),
    ).filter((c) => !this.greenChars.includes(c))
    return yellowChars
  }

  /**
   * @return {string[]}
   */
  get grayChars() {
    const allWordFilters = this.wordFilters.map((wf) => wf.positions).flat()
    const grayChars = Array.from(
      new Set(allWordFilters.filter(({ value }) => value === WordFilter.COLORS.GRAY).map(({ character }) => character)),
    ).filter((c) => !this.greenChars.includes(c))
    return grayChars
  }

  /**
   *
   * @param {Word} word
   * @returns {{green: boolean, gray: boolean, yellow: boolean}}
   */
  evaluateWord(word) {
    const passGray = !this.grayChars.some((c) => word.hasChar(c))
    const passGreen = this.greenChars.every((c, i) => {
      if (c === null) return true
      const charInPos = word.characters[i] === c
      return charInPos
    })
    const passYellow = this.yellowChars.every((c, i) => {
      if (!word.hasChar(c)) return false
      const positionIsGreen = this.greenChars[i] !== null
      if (!positionIsGreen) return true

      return true
      const greenAligned = this.greenChars[i] === c
      if (greenAligned) return true
      return false
    })

    const print = word.toString() === this.secretWord.toString()
    print && console.log({ word: word.toString(), passGray, passGreen, passYellow })
    return { gray: passGray, green: passGreen, yellow: passYellow }
  }

  /**
   * @returns {Word}
   */
  guessWord() {
    let availableWords = this.allWords.filter((w) => !this.usedWords.includes(w.toString()))

    if (availableWords.length === 0) {
      throw new Error('No words remaining')
    } else if (availableWords.length === 1) {
      return availableWords[0]
    } else {
      // let testingFilters = availableWords.filter((word) => {
      //   const { gray, green, yellow } = this.evaluateWord(word)
      //   return gray && yellow && green
      // })

      const gradedWords = availableWords.map((word) => ({ grade: this.evaluateWord(word), word }))
      const typeGradedWords = {
        g: gradedWords.filter(({ grade }) => grade.gray).map(({ word }) => word),
        v: gradedWords.filter(({ grade }) => grade.green).map(({ word }) => word),
        y: gradedWords.filter(({ grade }) => grade.yellow).map(({ word }) => word),
        gv: gradedWords.filter(({ grade }) => grade.gray && grade.green).map(({ word }) => word),
        gy: gradedWords.filter(({ grade }) => grade.gray && grade.yellow).map(({ word }) => word),
        yv: gradedWords.filter(({ grade }) => grade.green && grade.yellow).map(({ word }) => word),
        gvy: gradedWords.filter(({ grade }) => grade.gray && grade.green && grade.yellow).map(({ word }) => word),
      }

      const usedKey = (() => {
        const values = Object.values(typeGradedWords).map((e) => e.length)
        const max = Math.min(...values)
        return Object.keys(typeGradedWords)[values.findIndex((e) => e === max)]
      })()

      console.log('Using type grade:', usedKey)
      return this.gradeWords([1, 1, 1], typeGradedWords[usedKey])[0].word
    }
  }

  /**
   * @param {number[]} params
   * @param {Word[]} words
   */
  gradeWords(params, words) {
    const existingCharacters = Array.from(new Set(this.greenChars.concat(this.yellowChars).filter((c) => c !== null)))
    const gradedWords = words
      .map((word, i) => {
        const existingCharactersGrade = word.characters.filter((c) => !existingCharacters.includes(c)).length / 5
        const repeatedCharactersGrade = new Set(word.characters).size / 5
        const valuableCharactersGrade = word.characters.reduce(
          (acc, character) => acc + CHARS_GRADING[character] / 5,
          0,
        )
        return {
          word,
          grade: [
            existingCharactersGrade * params[0],
            repeatedCharactersGrade * params[1],
            valuableCharactersGrade * params[2],
          ],
        }
      })
      .sort((a, b) => b.grade.reduce((a, e) => a + e) - a.grade.reduce((a, e) => a + e))

    return gradedWords
  }

  play(verbose = true, params = [1, 1, 1, 1]) {
    const wordToTest = this.guessWord()
    const result = this.newTry(wordToTest)
    this.wordFilters.push(result)
    if (result.isWin) {
      if (verbose) console.log(result.toString())
      if (verbose) console.log('WIN :D\n----------------------', this.wordFilters.length)
      return
    } else {
      if (verbose) console.log(result.toString())
      if (this.wordFilters.length === 6) {
        if (verbose) console.log('LOSE D:')
        // return
      }
      this.play(verbose)
    }
  }
}

/**
 * @template T
 * @param {Array<T>} arr
 * @returns {Array<T>}
 */
function shuffle(arr) {
  for (let i = 0; i < arr.length; i++) {
    const x = Math.floor(Math.random() * arr.length)
    const y = Math.floor(Math.random() * arr.length)
    if (x === y) {
      continue
    }
    const temp0 = arr[x]
    arr[x] = arr[y]
    arr[y] = temp0
  }
  return arr
}

function train(generations, children) {
  let bestAvg = 100
  /**
   * @type {number[]}
   */
  let bestAvgParams = []
  /**
   * @returns {number[]}
   */
  function getRandomParams(n) {
    return new Array(n).fill(null).map(() => Math.random() * 100)
  }

  function loop() {
    const newParams = getRandomParams(4)
    const { avg } = shuffle(words.slice(0))
      .slice(0, children)
      .reduce(
        ({ avg }, w, i, { length }) => {
          const game = new Game(w, words)

          game.play(false, newParams)

          const tries = game.wordFilters.length

          process.stdout.clearLine(0)
          process.stdout.cursorTo(0)
          process.stdout.write(`${((i / (length - 1)) * 100).toFixed(2)}% -- Avg: ${avg.toFixed(2)}`)

          return { avg: avg + tries / length }
        },
        { avg: 0 },
      )

    if (avg < bestAvg) {
      bestAvg = avg
      bestAvgParams = newParams
    }
  }

  for (let i = 0; i < generations; i++) {
    console.log('Generation:', i + 1)
    loop()
    console.log('\nCurrent best:', {
      bestAvg,
      bestAvgParams,
    })
  }

  return {
    bestAvg,
    bestAvgParams,
  }
}

// console.log(train(1000, 100))

// const secret = shuffle(words.slice(0))[0]
// const secret = 'zafon'
// console.log({ secret })
// new Game(secret, words).play(true, [1, 1, 1, 1])

const game = new Game('', words)
game.wordFilters.push(
  new WordFilter([
    { character: 'o', value: WordFilter.COLORS.GRAY },
    { character: 'r', value: WordFilter.COLORS.GRAY },
    { character: 'a', value: WordFilter.COLORS.GREEN },
    { character: 's', value: WordFilter.COLORS.GRAY },
    { character: 'e', value: WordFilter.COLORS.GRAY },
  ]),
  new WordFilter([
    { character: 't', value: WordFilter.COLORS.GRAY },
    { character: 'u', value: WordFilter.COLORS.GRAY },
    { character: 'a', value: WordFilter.COLORS.GREEN },
    { character: 'n', value: WordFilter.COLORS.GRAY },
    { character: 'i', value: WordFilter.COLORS.GRAY },
  ]),
  new WordFilter([
    { character: 'c', value: WordFilter.COLORS.GRAY },
    { character: 'l', value: WordFilter.COLORS.GREEN },
    { character: 'a', value: WordFilter.COLORS.GREEN },
    { character: 'm', value: WordFilter.COLORS.GRAY },
    { character: 'a', value: WordFilter.COLORS.GREEN },
  ]),
  new WordFilter([
    { character: 'p', value: WordFilter.COLORS.GRAY },
    { character: 'l', value: WordFilter.COLORS.GREEN },
    { character: 'a', value: WordFilter.COLORS.GREEN },
    { character: 'g', value: WordFilter.COLORS.GREEN },
    { character: 'a', value: WordFilter.COLORS.GREEN },
  ]),
  new WordFilter([
    { character: 'a', value: WordFilter.COLORS.GRAY },
    { character: 'l', value: WordFilter.COLORS.GREEN },
    { character: 'a', value: WordFilter.COLORS.GREEN },
    { character: 'g', value: WordFilter.COLORS.GREEN },
    { character: 'a', value: WordFilter.COLORS.GREEN },
  ]),
)
console.log(game.guessWord().toString())

// const game = new Game('tapir', words)
// game.newTry(new Word('ababa'))
// game.newTry(new Word('acala'))
// game.newTry(new Word('adama'))
// game.newTry(new Word('aerea'))
// game.newTry(new Word('afiar'))
// game.newTry(new Word('aitor'))
// game.newTry(new Word('hitar'))
// game.newTry(new Word('jitar'))
// // game.wordFilters.push(
// //   new WordFilter([
// //     { character: 'p', value: WordFilter.COLORS.YELLOW },
// //     { character: 'i', value: WordFilter.COLORS.YELLOW },
// //     { character: 't', value: WordFilter.COLORS.YELLOW },
// //     { character: 'a', value: WordFilter.COLORS.YELLOW },
// //     { character: 'r', value: WordFilter.COLORS.GREEN },
// //   ]),
// // )
// game.play()

// console.log({
//   bestAvg,
//   bestAvgParams,
// })
