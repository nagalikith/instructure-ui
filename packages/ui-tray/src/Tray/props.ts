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

import { element } from '@instructure/ui-prop-types'

import type { WithStyleProps, ComponentStyle } from '@instructure/emotion'
import type {
  OtherHTMLAttributes,
  PropValidators,
  TrayTheme,
  LiveRegion
} from '@instructure/shared-types'
import type { BidirectionalProps } from '@instructure/ui-i18n'
import type { TransitionType } from '@instructure/ui-motion'

type TrayOwnProps = {
  label: string
  size?: 'x-small' | 'small' | 'regular' | 'medium' | 'large'
  placement?: 'top' | 'bottom' | 'start' | 'end' | 'center'
  open?: boolean
  defaultFocusElement?: React.ReactElement | ((...args: any[]) => any)
  contentRef?: (...args: any[]) => any
  shouldContainFocus?: boolean
  shouldReturnFocus?: boolean
  shouldCloseOnDocumentClick?: boolean
  onOpen?: (type?: TransitionType) => void
  onClose?: (type?: TransitionType) => void
  onDismiss?: (...args: any[]) => any
  mountNode?: any // TODO: PropTypes.oneOfType([element, PropTypes.func])
  insertAt?: 'bottom' | 'top'
  liveRegion?: LiveRegion
  onTransition?: (...args: any[]) => any
  onEnter?: (...args: any[]) => any
  onEntering?: (...args: any[]) => any
  onEntered?: (type?: TransitionType) => void
  onExit?: (...args: any[]) => any
  onExiting?: (...args: any[]) => any
  onExited?: (type?: TransitionType) => void
  border?: boolean
  shadow?: boolean
  children?: React.ReactNode
}

type PropKeys = keyof TrayOwnProps

type AllowedPropKeys = Readonly<Array<PropKeys>>

type TrayProps = TrayOwnProps &
  BidirectionalProps &
  WithStyleProps<TrayTheme, TrayStyle> &
  OtherHTMLAttributes<TrayOwnProps>

type TrayStyle = ComponentStyle<'tray' | 'content'>

const propTypes: PropValidators<PropKeys> = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,

  /**
   * The size (width) of the `<Tray />` when placement is `start` or `end`
   */
  size: PropTypes.oneOf(['x-small', 'small', 'regular', 'medium', 'large']),

  /**
   * Placement to determine where the `<Tray />` should display in the viewport
   */
  placement: PropTypes.oneOf(['top', 'bottom', 'start', 'end', 'center']),

  /**
   * Whether or not the `<Tray />` is open
   */
  open: PropTypes.bool,

  /**
   * An element or a function returning an element to focus by default
   */
  defaultFocusElement: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),

  /**
   *
   * A function that returns a reference to the content element
   */
  contentRef: PropTypes.func,

  /**
   * Whether focus should be contained within the `<Tray/>` when it is open
   */
  shouldContainFocus: PropTypes.bool,

  /**
   * Whether focus should be restored when the `<Tray/>` is closed
   */
  shouldReturnFocus: PropTypes.bool,

  /**
   * Should the `<Tray />` hide when clicks occur outside the content
   */
  shouldCloseOnDocumentClick: PropTypes.bool,

  /**
   * Callback fired when `<Tray />` content has been mounted in the DOM
   */
  onOpen: PropTypes.func,

  /**
   * Callback fired when `<Tray />` has been unmounted from the DOM
   */
  onClose: PropTypes.func,

  /**
   * Callback fired when the `<Tray />` is requesting to be closed
   */
  onDismiss: PropTypes.func,

  /**
   * An element or a function returning an element to use as the mount node
   * for the `<Tray />` (defaults to `document.body`)
   */
  mountNode: PropTypes.oneOfType([element, PropTypes.func]),

  /**
   * Insert the element at the 'top' of the mountNode or at the 'bottom'
   */
  insertAt: PropTypes.oneOf(['bottom', 'top']),

  /**
   * An element, function returning an element, or array of elements that will not be hidden from
   * the screen reader when the `<Tray />` is open
   */
  liveRegion: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
    PropTypes.func
  ]),

  /**
   * Callback fired when the <Tray /> transitions in/out
   */
  onTransition: PropTypes.func,
  /**
   * Callback fired before the <Tray /> transitions in
   */
  onEnter: PropTypes.func,
  /**
   * Callback fired as the <Tray /> begins to transition in
   */
  onEntering: PropTypes.func,
  /**
   * Callback fired after the <Tray /> finishes transitioning in
   */
  onEntered: PropTypes.func,
  /**
   * Callback fired right before the <Tray /> transitions out
   */
  onExit: PropTypes.func,
  /**
   * Callback fired as the <Tray /> begins to transition out
   */
  onExiting: PropTypes.func,
  /**
   * Callback fired after the <Tray /> finishes transitioning out
   */
  onExited: PropTypes.func,

  /**
   * Should the `<Tray />` have a border
   */
  border: PropTypes.bool,

  /**
   * Should the `<Tray />` have a box shadow
   */
  shadow: PropTypes.bool
}

const allowedProps: AllowedPropKeys = [
  'label',
  'children',
  'size',
  'placement',
  'open',
  'defaultFocusElement',
  'contentRef',
  'shouldContainFocus',
  'shouldReturnFocus',
  'shouldCloseOnDocumentClick',
  'onOpen',
  'onClose',
  'onDismiss',
  'mountNode',
  'insertAt',
  'liveRegion',
  'onTransition',
  'onEnter',
  'onEntering',
  'onEntered',
  'onExit',
  'onExiting',
  'onExited',
  'border',
  'shadow'
]

export type { TrayProps, TrayStyle }
export { propTypes, allowedProps }
