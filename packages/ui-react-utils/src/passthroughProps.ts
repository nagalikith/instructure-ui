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
// list of "valid" props https://github.com/emotion-js/emotion/blob/master/packages/is-prop-valid/src/props.js
import isPropValid from '@emotion/is-prop-valid'

/**
 * Removes disallowed keys from the given object. Allowed keys: Valid props for
 * HTML or SVG elements (see https://github.com/emotion-js/emotion/tree/main/packages/is-prop-valid)
 *
 * Disallowed is anything else and 'style', 'styles', 'className', 'children',
 * 'makeStyles', 'deterministicId'
 * @param props The props to process
 */
function passthroughProps<P>(props: P) {
  const validProps: Partial<P> = {}
  Object.keys(props)
    // style and className need to be explicitly passed through
    // styles and makeStyle can not pass through
    .filter(
      (propName) =>
        isPropValid(propName) &&
        propName !== 'style' &&
        propName !== 'className' &&
        propName !== 'children' &&
        propName !== 'styles' &&
        propName !== 'makeStyles' &&
        propName !== 'deterministicId'
    )
    .forEach((propName) => {
      validProps[propName as keyof P] = props[propName as keyof P]
    })
  return validProps as Record<string, any>
}

export { passthroughProps }
export default passthroughProps
