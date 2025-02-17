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

import { IconCheckSolid, IconArrowOpenEndSolid } from '@instructure/ui-icons'
import type { StoryConfig } from '@instructure/ui-test-utils'
import type { OptionsItemProps } from '../props'

export default {
  maxExamplesPerPage: 50,
  propValues: {
    renderAfterLabel: [null, IconArrowOpenEndSolid],
    renderBeforeLabel: [null, IconCheckSolid],
    description: [
      null,
      'Curabitur fringilla, urna ut efficitur molestie, nibh lacus tincidunt elit, ut tempor ipsum nunc sit amet massa. Integer sit amet ante vitae lectus gravida pulvinar.'
    ]
  },
  getComponentProps: (props) => {
    return {
      renderAfterLabel: props.renderAfterLabel,
      renderBeforeLabel: props.renderBeforeLabel,
      children: 'Lorem ipsum dolor sit amet',
      role: 'none',
      descriptionRole: 'note'
    }
  },
  getExampleProps: () => {
    return {
      width: '400px'
    }
  },
  filter: (props) => {
    if (props.description) {
      if (
        props.beforeLabelContentVAlign !== 'center' &&
        (!props.renderBeforeLabel || props.renderAfterLabel)
      ) {
        return true
      }

      if (
        props.afterLabelContentVAlign !== 'center' &&
        (!props.renderAfterLabel || props.renderBeforeLabel)
      ) {
        return true
      }
    }

    if (!props.description) {
      if (
        props.afterLabelContentVAlign !== 'center' ||
        props.beforeLabelContentVAlign !== 'center'
      ) {
        return true
      }
    }

    return false
  }
} as StoryConfig<OptionsItemProps>
