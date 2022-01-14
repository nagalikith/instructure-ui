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

import React from 'react'
import PropTypes from 'prop-types'

import { Children } from '@instructure/ui-prop-types'

import DrilldownOption from '../DrilldownOption'
import DrilldownSeparator from '../DrilldownSeparator'

import type {
  OtherHTMLAttributes,
  PropValidators,
  OptionsTheme
} from '@instructure/shared-types'
import type { WithStyleProps } from '@instructure/emotion'

import type { DrilldownOptionValue } from '../DrilldownOption/props'
import type { OptionChild, SeparatorChild } from '../props'

type DrilldownGroupOwnProps = {
  id: string
  children?: (OptionChild | SeparatorChild)[] // TODO: type Children.oneOf([DrilldownOption, DrilldownSeparator])
  renderGroupTitle?: React.ReactNode | (() => React.ReactNode)
  withoutSeparators?: boolean
  isDisabled?: boolean

  // selection props
  /**
   * With this prop the group can be converted into a single-select (radio) or a multi-select (checkbox) group.
   */
  selectableType?: 'single' | 'multiple'
  /**
   * an array of the values (or indices by default) for the selected items on initial render
   */
  defaultSelected?: DrilldownOptionValue[]
  /**
   * Callback fired when an item within the `<Drilldown.Group />` is selected
   */
  onSelect?: (
    event: React.SyntheticEvent,
    value: DrilldownOptionValue[],
    isSelected: boolean,
    selectedOption: OptionChild
  ) => void
}

type PropKeys = keyof DrilldownGroupOwnProps

type AllowedPropKeys = Readonly<Array<PropKeys>>

type DrilldownGroupProps = DrilldownGroupOwnProps &
  WithStyleProps<OptionsTheme, null> &
  OtherHTMLAttributes<DrilldownGroupOwnProps>

const propTypes: PropValidators<PropKeys> = {
  id: PropTypes.string.isRequired,
  children: Children.oneOf([DrilldownOption, DrilldownSeparator]),
  renderGroupTitle: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  withoutSeparators: PropTypes.bool,
  isDisabled: PropTypes.bool,
  selectableType: PropTypes.oneOf(['single', 'multiple']),
  defaultSelected: PropTypes.array,
  onSelect: PropTypes.func
}

const allowedProps: AllowedPropKeys = [
  'id',
  'children',
  'renderGroupTitle',
  'withoutSeparators',
  'isDisabled',
  'selectableType',
  'defaultSelected',
  'onSelect'
]

export type { DrilldownGroupProps }
export { propTypes, allowedProps }
