/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - present Instructure, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

type Props<T> = T extends Record<string, infer V> ? Record<keyof T, V> : T
type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

/**
 * Given possible values for each prop, returns all combinations of those prop values.
 * To generate the prop names and values from the component source see the `parsePropValues` utility
 *
 * @param {Object} propValues an object with the shape {propName: arrayOfPossibleValues}
 * @returns {Array} an array of all prop combinations [{propAName: propAValue, propBName: propBValue}]
 *
 * @module generatePropCombinations
 * @private
 */
export function generatePropCombinations<T>(propValues: Props<T>) {
  type PropValueType = ArrayElement<Props<T>[keyof Props<T>]>
  const propNames = Object.keys(propValues)
  const combos: Array<Record<keyof Props<T>, PropValueType>> = []

  if (!propNames.length) return combos

  const numProps = propNames.length
  for (let i = 0; i < numProps; i++) {
    const propName = propNames[i]
    const valuesForProp = propValues[propName as keyof Props<T>]

    if (!Array.isArray(valuesForProp) || !valuesForProp.length) {
      throw new Error(
        `[ui-examples-loader] Please provide a non-empty array of possible values for
        prop ${propName}. in "propValues"`
      )
    }

    const numValues = valuesForProp.length
    const numCombos = combos.length

    for (let j = 0; j < numValues; j++) {
      const propValue = valuesForProp[j]
      if (numCombos > 0) {
        for (let k = 0; k < numCombos; k++) {
          const combo = combos[k]

          // Check against the keys of the object here. `combo[propName]` could
          // evaluate to a boolean value which will mess up this logic.
          if (!Object.keys(combo).includes(propName)) {
            // eslint-disable-next-line no-param-reassign
            combo[propName as keyof Props<T>] = propValue
          } else {
            combos.push({ ...combo, [propName]: propValue })
          }
        }
      } else {
        //@ts-expect-error TODO: fix this
        combos.push({ [propName]: propValue as PropValueType })
      }
    }
  }
  return combos
}

export default generatePropCombinations
