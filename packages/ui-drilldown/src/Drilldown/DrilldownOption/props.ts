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

import type {
  OtherHTMLAttributes,
  PropValidators,
  OptionsItemTheme,
  AsElementType
} from '@instructure/shared-types'
import type { WithStyleProps } from '@instructure/emotion'
import type { OptionsItemProps } from '@instructure/ui-options'

type DrilldownOptionValue = string | number | undefined

type RenderContentVAlign = 'start' | 'center' | 'end'

type DrilldownOptionVariant = Exclude<OptionsItemProps['variant'], 'selected'>

type RenderContentProps = {
  as: DrilldownOptionOwnProps['as']
  role: DrilldownOptionOwnProps['role']
  variant: DrilldownOptionVariant
  vAlign: RenderContentVAlign
  isSelected: boolean
}

type DrilldownOptionOwnProps = {
  id: string

  children?:
    | React.ReactNode
    | ((props: {
        id: string
        variant: DrilldownOptionVariant
        isSelected: boolean
      }) => React.ReactNode)

  subPageId?: string

  isDisabled?: boolean

  value?: DrilldownOptionValue

  /**
   * Element type to render as
   */
  as?: AsElementType

  /**
   * The ARIA role of the element
   */
  role?: string

  /**
   * Content to render before the label
   * (if you pass a function, it has the `props` as its parameter)
   */
  renderBeforeLabel?:
    | React.ReactNode
    | ((props: RenderContentProps) => React.ReactNode)

  /**
   * Content to render after the label
   * (if you pass a function, it has the `props` as its parameter)
   */
  renderAfterLabel?:
    | React.ReactNode
    | ((props: RenderContentProps) => React.ReactNode)

  /**
   * Sets the vAlign of renderBeforeLabel content
   */
  beforeLabelContentVAlign?: RenderContentVAlign

  /**
   * Sets the vAlign of renderAfterLabel content
   */
  afterLabelContentVAlign?: RenderContentVAlign

  /**
   * Additional "secondary" description text
   */
  description?: React.ReactNode | (() => React.ReactNode)

  /**
   * The ARIA role of the description element
   */
  descriptionRole?: string

  onOptionClick?: (event: React.SyntheticEvent, optionId: string) => void

  defaultSelected?: boolean

  /**
   * provides a reference to the underlying html root element
   */
  elementRef?: (element: Element | null) => void
}

type PropKeys = keyof DrilldownOptionOwnProps

type AllowedPropKeys = Readonly<Array<PropKeys>>

type DrilldownOptionProps = DrilldownOptionOwnProps &
  WithStyleProps<OptionsItemTheme, null> &
  OtherHTMLAttributes<DrilldownOptionOwnProps>

const propTypes: PropValidators<PropKeys> = {
  id: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  subPageId: PropTypes.string,
  isDisabled: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  as: PropTypes.elementType,
  role: PropTypes.string,
  renderBeforeLabel: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  renderAfterLabel: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  beforeLabelContentVAlign: PropTypes.oneOf(['start', 'center', 'end']),
  afterLabelContentVAlign: PropTypes.oneOf(['start', 'center', 'end']),
  description: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  descriptionRole: PropTypes.string,
  onOptionClick: PropTypes.func,
  defaultSelected: PropTypes.bool,
  elementRef: PropTypes.func
}

const allowedProps: AllowedPropKeys = [
  'id',
  'children',
  'subPageId',
  'isDisabled',
  'value',
  'as',
  'role',
  'renderBeforeLabel',
  'renderAfterLabel',
  'beforeLabelContentVAlign',
  'afterLabelContentVAlign',
  'description',
  'descriptionRole',
  'onOptionClick',
  'defaultSelected',
  'elementRef'
]

export type { DrilldownOptionProps, DrilldownOptionValue }
export { propTypes, allowedProps }
