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

// TODO: check all ref and elementRef handling

// TODO: optimize code

// TODO: add all necessary eventHandlers

// TODO: controlled select? need it?
// Edit: Since only groups have selections, and the defaultSelected can be set, I think we shouldn't add this feature, just if someone requests it later

// TODO: history management
// Edit: for now the pageHistory and the nav methods are exposed on the onToggle method  is it enough?

// TODO: ARIA tags and roles - menu? combobox? both?
// Info:
// It's a big topic, we need an a11y person for it
//  - option aria role (option? menuitem? menuitemcheckbox? menuitemradio?)
//  - is it an option in a listbox (Selectable) or Menu with menuitems? settable?
//  - hidden input for a11y? role="combobox" might be need it
//  - does the trigger need the selectable trigger props/hidden input/nothing?

// TODO: decide whether we can turn of child check on Options
// Edit: for now we decided not to change Options and leave everything in this file, we can refactor it later

// TODO: rotate focus on drilldown options (when using up-down arrows)
// Edit: I made it settable with a props, but let's decide whether we should make it be the default and not settable?

// TODO: `href` prop on option?
// Edit: Is it needed? Probably nice if the drilldown acts like a Menu.
// Problem: It cannot be done atm, the Options component overrides the Options.Item's as prop, probably a bug, needs to be fixed first.
// Question: Is it going to work with the roles and etc? a11y needs to be checked too.

// TODO: `controls` props on option?
// Menu.Items have it, do we need it?

// TODO: new  `` prop for Options.Item

/** @jsx jsx */
/** @jsxFrag React.Fragment */
import React, { Component, ReactElement } from 'react'

import { uid } from '@instructure/uid'
import { warn, error } from '@instructure/console'
import { testable } from '@instructure/ui-testable'
import { contains, containsActiveElement } from '@instructure/ui-dom-utils'
import {
  callRenderProp,
  matchComponentTypes,
  omitProps,
  safeCloneElement
} from '@instructure/ui-react-utils'

import { View } from '@instructure/ui-view'
import { Options } from '@instructure/ui-options'
import { Popover } from '@instructure/ui-popover'
import type {
  OptionsProps,
  OptionsItemProps,
  OptionsSeparatorProps
} from '@instructure/ui-options'
import {
  IconArrowOpenStartSolid,
  IconArrowOpenEndSolid,
  IconCheckSolid
} from '@instructure/ui-icons'
import { Selectable } from '@instructure/ui-selectable'
import type { SelectableRender } from '@instructure/ui-selectable'

import { withStyle, jsx } from '@instructure/emotion'

import { DrilldownOption } from './DrilldownOption'
import { DrilldownSeparator } from './DrilldownSeparator'
import { DrilldownGroup } from './DrilldownGroup'
import { DrilldownPage } from './DrilldownPage'
import type { DrilldownPageProps, PageChildren } from './DrilldownPage/props'

import generateStyle from './styles'
import generateComponentTheme from './theme'

import { propTypes, allowedProps, PageChild } from './props'

import type {
  DrilldownProps,
  DrilldownStyleProps,
  DrilldownState,
  OptionChild,
  SeparatorChild,
  GroupChild
} from './props'
import { DrilldownGroupProps } from './DrilldownGroup/props'
import {
  DrilldownOptionProps,
  DrilldownOptionValue
} from './DrilldownOption/props'

// Additional data we need to track on the Options,
// but shouldn't be settable via props
type OptionData = {
  groupProps?: DrilldownGroupProps
}

// Contains the Option ComponentElement and the extra data we need track on it
type MappedOption = OptionChild & OptionData

// Contains the props object of the Page
// with the `children` transformed into an array
type MappedPage = DrilldownPageProps & {
  children: PageChildren[]
}

// An object with the mapped Pages with their id as keys
type PageMap = Record<string, MappedPage>

// A Map width the selected options in a group, with the id as key and their value
type SelectedGroupOptionsMap = Map<string, DrilldownOptionValue>

type GroupSeparatorData = {
  isFirstChild: boolean
  isLastChild: boolean
  afterSeparator: boolean
}

/**
---
category: components/WIP
---
@tsProps
**/
@withStyle(generateStyle, generateComponentTheme)
@testable()
class Drilldown extends Component<DrilldownProps, DrilldownState> {
  static readonly componentId = 'Drilldown'

  static propTypes = propTypes
  static allowedProps = allowedProps
  static defaultProps = {
    isDisabled: false,
    rotateFocus: true,
    overflowX: 'auto',
    overflowY: 'auto',
    placement: 'bottom center',
    defaultShow: false,
    shouldHideOnSelect: true,
    shouldFocusTriggerOnClose: true,
    withArrow: true,
    offsetX: 0,
    offsetY: 0
  }

  static Group = DrilldownGroup
  static Option = DrilldownOption
  static Page = DrilldownPage
  static Separator = DrilldownSeparator

  ref: HTMLDivElement | Element | null = null
  _drilldownRef: HTMLDivElement | null = null
  _popover: Popover | null = null
  _trigger: (React.ReactInstance & { focus?: () => void }) | null = null

  _containerElement: HTMLDivElement | null = null
  _optionsElement: HTMLDivElement | null = null

  handleRef = (el: Element | null) => {
    const { drilldownRef } = this.props

    this._drilldownRef = el as HTMLDivElement

    // if a trigger is provided, the Popover sets the ref
    if (!this.props.trigger) {
      this.ref = el as HTMLDivElement
    }

    if (typeof drilldownRef === 'function') {
      drilldownRef(el as HTMLDivElement)
    }
  }

  private readonly _id: string
  private readonly _labelId: string
  private readonly _headerBackId: string
  private readonly _headerTitleId: string
  private readonly _headerActionId: string

  private readonly _pageHistory: string[]

  private _activeOptionsMap: {
    [optionId: string]: MappedOption
  } = {}
  private _selectedGroupOptionIds: {
    [groupId: string]: SelectedGroupOptionsMap
  } = {}

  constructor(props: DrilldownProps) {
    super(props)

    this.state = {
      isShowingPopover: props.trigger ? !!props.show : false,
      activePageId: props.rootPageId,
      highlightedOptionId: undefined,
      lastSelectedId: undefined
    }

    this._pageHistory = [props.rootPageId]

    this.setDefaultSelected()

    this._id = props.id || uid('Drilldown')
    this._labelId = uid('Drilldown-label')
    this._headerBackId = uid('DrilldownHeader-Back')
    this._headerTitleId = uid('DrilldownHeader-Title')
    this._headerActionId = uid('DrilldownHeader-Action')
  }

  componentDidMount() {
    this.props.makeStyles?.(this.makeStylesVariables)
  }

  componentDidUpdate(_prevProps: DrilldownProps) {
    this.props.makeStyles?.(this.makeStylesVariables)

    // if the current page was removed
    if (!this.currentPage) {
      if (this.previousPage) {
        this.goToPreviousPage()
      } else {
        this.goToPage(this.props.rootPageId)
      }
    }

    if (
      this.state.highlightedOptionId &&
      !this.getPageChildById(this.state.highlightedOptionId)
    ) {
      this.setState({
        highlightedOptionId: undefined
      })
    }
  }

  get makeStylesVariables(): DrilldownStyleProps {
    return {
      hasHighlightedOption: !!this.state.highlightedOptionId
    }
  }

  get activeOptionIds() {
    return Object.keys(this._activeOptionsMap)
  }

  get activeOptions() {
    return Object.values(this._activeOptionsMap)
  }

  get pages(): PageChild[] {
    const { children } = this.props
    return React.Children.toArray(children || []) as PageChild[]
  }

  get pageMap(): PageMap | undefined {
    const { children } = this.props

    if (!children) {
      return undefined
    }

    const map: PageMap | undefined = {}

    this.pages.forEach((page) => {
      const { props } = page
      const { children } = props

      map[props.id] = {
        ...props,
        children: React.Children.toArray(children || []) as PageChildren[]
      }
    })

    return map
  }

  get currentPage(): MappedPage | undefined {
    return this.getPageById(this.state.activePageId)
  }

  get previousPage(): MappedPage | undefined {
    const previousPageId = this._pageHistory[this._pageHistory.length - 2]
    return this.getPageById(previousPageId)
  }

  getPageById(id?: string): MappedPage | undefined {
    return this.pageMap && id ? this.pageMap[id] : undefined
  }

  getPageChildById(id?: string) {
    return id ? this._activeOptionsMap[id] : undefined
  }

  // getGroupOptionIds(group: GroupChild) {
  //   const { children } = group.props
  //
  //   if (!children) {
  //     return []
  //   }
  //
  //   return children
  //     .map((option) => option.props.id)
  //     .filter((childId) => this.activeOptionIds.includes(childId))
  // }

  setDefaultSelected() {
    this.pages.forEach((page) => {
      const { children } = page.props
      let childrenArray: PageChildren[] = []

      if (children) {
        childrenArray = Array.isArray(children) ? children : [children]
      }

      childrenArray.forEach((child) => {
        if (matchComponentTypes<GroupChild>(child, [DrilldownGroup])) {
          const {
            id: groupId,
            selectableType,
            defaultSelected: groupDefaultSelected = [],
            children: groupChildren
          } = child.props

          if (!selectableType) {
            return
          }

          this._selectedGroupOptionIds[groupId] = new Map()

          groupChildren?.forEach((groupChild) => {
            if (
              matchComponentTypes<OptionChild>(groupChild, [DrilldownOption])
            ) {
              const {
                id: optionId,
                value: optionValue,
                defaultSelected: optionDefaultSelected
              } = groupChild.props

              const isGroupDefaultSelected =
                typeof optionValue !== 'undefined' &&
                groupDefaultSelected
                  .filter((value) => typeof value !== 'undefined')
                  .includes(optionValue)

              if (optionDefaultSelected || isGroupDefaultSelected) {
                this._selectedGroupOptionIds[groupId].set(optionId, optionValue)
              }
            }
          })
        }
      })
    })
  }

  get selectedGroupOptionIds() {
    return Object.values(this._selectedGroupOptionIds)
      .map((groupIdMap) => Array.from(groupIdMap.keys()))
      .flat()
  }

  get headerChildren() {
    const { currentPage } = this
    const { styles } = this.props

    const headerChildren: PageChildren[] = []

    if (!currentPage) {
      return headerChildren
    }

    const {
      children,
      renderBackButtonLabel,
      renderTitle,
      renderActionLabel,
      onHeaderActionClicked,
      withoutHeaderSeparators
    } = currentPage

    // Back navigation option
    if (this.previousPage) {
      const prevPageTitle = callRenderProp(this.previousPage.renderTitle)

      const backButtonLabel: React.ReactNode = callRenderProp(
        renderBackButtonLabel,
        prevPageTitle
      )

      headerChildren.push(
        <DrilldownOption
          id={this._headerBackId}
          onOptionClick={this.handleBackButtonClick}
        >
          <div css={styles?.headerBack}>{backButtonLabel}</div>
        </DrilldownOption>
      )
    }

    // Header title
    if (renderTitle) {
      const title = callRenderProp(renderTitle)

      headerChildren.push(
        <DrilldownOption id={this._headerTitleId}>
          <div css={styles?.headerTitle}>{title}</div>
        </DrilldownOption>
      )
    }

    // Action label
    if (renderActionLabel) {
      headerChildren.push(
        <DrilldownOption
          id={this._headerActionId}
          themeOverride={{ color: styles?.headerActionColor }}
          onOptionClick={(event) => {
            if (typeof onHeaderActionClicked === 'function') {
              onHeaderActionClicked(event)
            }
          }}
        >
          {callRenderProp(renderActionLabel)}
        </DrilldownOption>
      )
    }

    // header separator
    if (
      headerChildren.length > 0 &&
      children.length > 0 &&
      !withoutHeaderSeparators
    ) {
      headerChildren.push(
        <DrilldownSeparator id={uid('DrilldownHeader-Separator')} />
      )
    }

    return headerChildren
  }

  get shown() {
    return this.props.trigger ? this.state.isShowingPopover : true
  }

  show = (event: React.SyntheticEvent) => {
    if (this._popover) {
      this._popover.show(event as React.UIEvent | React.FocusEvent)
      this.setState({ isShowingPopover: true })
    }
  }

  hide = (event: React.SyntheticEvent) => {
    if (this._popover) {
      this._popover.hide(event as React.UIEvent | React.FocusEvent)
      this.setState({ isShowingPopover: false })
      this.reset()
    }
  }

  reset() {
    this._activeOptionsMap = {}
    this.setState({ highlightedOptionId: undefined })
  }

  public focus() {
    if (this.shown) {
      error(
        !!this._drilldownRef?.focus,
        '[Drilldown] Could not focus the drilldown.'
      )
      this._drilldownRef?.focus()
    } else {
      error(!!this._trigger?.focus, '[Drilldown] Could not focus the trigger.')
      this._trigger!.focus!()
    }
  }

  public focused() {
    if (this.shown) {
      return containsActiveElement(this._drilldownRef)
    } else {
      return containsActiveElement(this._trigger)
    }
  }

  hasGroupFirstSeparator(
    group: GroupChild,
    groupSeparatorData: GroupSeparatorData
  ) {
    const { withoutSeparators } = group.props
    const { isFirstChild, afterSeparator } = groupSeparatorData
    return !withoutSeparators && !isFirstChild && !afterSeparator
  }

  hasGroupLastSeparator(
    group: GroupChild,
    groupSeparatorData: GroupSeparatorData
  ) {
    const { withoutSeparators } = group.props
    const { isLastChild } = groupSeparatorData
    return !withoutSeparators && !isLastChild
  }

  renderGroup(
    group: GroupChild,
    getOptionProps: SelectableRender['getOptionProps'],
    getDisabledOptionProps: SelectableRender['getDisabledOptionProps'],
    needsFirstSeparator: boolean,
    needsLastSeparator: boolean
  ) {
    const { id, children, renderGroupTitle, themeOverride, selectableType } =
      group.props

    if (!children) {
      return null
    }

    const groupChildren: (
      | React.ReactElement<OptionsProps>
      | React.ReactElement<OptionsSeparatorProps>
    )[] = []

    // add a separator above
    if (needsFirstSeparator) {
      groupChildren.push(<Options.Separator />)
    }

    if (selectableType && !this._selectedGroupOptionIds[id]) {
      this._selectedGroupOptionIds[id] = new Map()
    }

    // create a sublist as a group
    // a wrapping list item will be created by Options
    groupChildren.push(
      <Options
        id={id}
        key={id}
        renderLabel={renderGroupTitle}
        // we pass the themeOverride to Options
        themeOverride={themeOverride}
      >
        {children.map((child) => {
          if (
            matchComponentTypes<SeparatorChild>(child, [DrilldownSeparator])
          ) {
            return this.renderSeparator(child)
          } else {
            return this.renderOption(
              child,
              getOptionProps,
              getDisabledOptionProps,
              group.props
            )
          }
        })}
      </Options>
    )

    // add a separator below
    if (needsLastSeparator) {
      groupChildren.push(<Options.Separator />)
    }

    return groupChildren
  }

  renderSeparator(separator: SeparatorChild) {
    const { id, themeOverride, ...props } = separator.props
    return (
      <Options.Separator
        id={id}
        key={id}
        {...props}
        // we pass the themeOverride to Options.Separator
        themeOverride={themeOverride}
      />
    )
  }

  renderOption(
    option: OptionChild,
    getOptionProps: SelectableRender['getOptionProps'],
    getDisabledOptionProps: SelectableRender['getDisabledOptionProps'],
    groupProps?: DrilldownGroupProps
  ) {
    const { styles } = this.props
    let isSelected = false

    const {
      id,
      children,
      as,
      role,
      subPageId,
      isDisabled,
      renderBeforeLabel,
      renderAfterLabel,
      beforeLabelContentVAlign,
      afterLabelContentVAlign,
      description,
      descriptionRole,
      themeOverride
    } = option.props

    if (this.getPageChildById(id)) {
      warn(
        false,
        `Duplicate id: "${id}"! Make sure all options have unique ids, otherwise they won't be rendered.`
      )
      return null
    }

    let optionProps: Partial<OptionsItemProps> = {
      // passthrough props
      ...omitProps(option.props, [
        ...DrilldownOption.allowedProps,
        ...Options.Item.allowedProps
      ]),
      // props from selectable
      ...getOptionProps({ id }),
      // we pass the themeOverride to Options.Item
      themeOverride,
      // directly passed props
      beforeLabelContentVAlign,
      afterLabelContentVAlign,
      description,
      descriptionRole,
      as,
      role,
      variant: 'default',
      tabIndex: -1
    }

    const optionData: OptionData = {
      groupProps: groupProps
    }

    const isOptionDisabled =
      id !== this._headerBackId && // Back nav is never disabled
      (this.props.isDisabled ||
        this.currentPage?.isDisabled ||
        groupProps?.isDisabled ||
        isDisabled)

    // should option be treated as disabled
    if (isOptionDisabled) {
      optionProps.variant = 'disabled'
      optionProps = { ...optionProps, ...getDisabledOptionProps() }
    }

    // track as valid option if not disabled and not the title
    if (!isOptionDisabled && id !== this._headerTitleId) {
      this._activeOptionsMap[id] = { ...option, ...optionData }
    }

    // BEFORE/AFTER elements:
    // we set a few manually on Options.Item,
    // the rest are handled by the DrilldownOption
    if (subPageId) {
      optionProps.renderAfterLabel = <IconArrowOpenEndSolid />
    }
    if (id === this._headerBackId) {
      optionProps.renderBeforeLabel = <IconArrowOpenStartSolid />
    }

    if (groupProps?.selectableType) {
      isSelected = this._selectedGroupOptionIds[groupProps.id].has(id)
      optionProps.renderBeforeLabel = (
        <IconCheckSolid
          style={{
            opacity: isSelected ? 1 : 0
          }}
        />
      )
    }

    // should option be treated as highlighted
    if (id === this.state.highlightedOptionId) {
      optionProps.variant = 'highlighted'
    }

    const vAlignMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end'
    }

    const renderContent = (type: 'before' | 'after') => {
      const renderProp:
        | DrilldownOptionProps['renderBeforeLabel']
        | DrilldownOptionProps['renderAfterLabel'] =
        type === 'before' ? renderBeforeLabel : renderAfterLabel

      const css =
        type === 'before'
          ? styles?.optionBeforeElement
          : styles?.optionAfterElement

      const vAlign =
        type === 'before' ? beforeLabelContentVAlign : afterLabelContentVAlign

      return renderProp ? (
        <span
          css={css}
          role="presentation"
          aria-hidden="true"
          style={{ alignSelf: vAlignMap[vAlign!] }}
        >
          {/* this container span is needed for correct vAlign */}
          <span role="none">
            {callRenderProp(renderProp, {
              variant: optionProps.variant,
              vAlign,
              as,
              role,
              isSelected
            })}
          </span>
        </span>
      ) : null
    }

    const label = callRenderProp(children, {
      id,
      variant: optionProps.variant,
      isSelected
    })

    if (!label) {
      warn(
        false,
        `There are no "children" prop provided for option with id: "${id}", so it won't be rendered.`
      )
      return null
    }

    return (
      <Options.Item {...optionProps} key={id}>
        <div css={styles?.optionContainer}>
          {renderContent('before')}

          <span css={styles?.optionContent}>{label}</span>

          {renderContent('after')}
        </div>
      </Options.Item>
    )
  }

  handleOptionHighlight = (
    _event: React.SyntheticEvent,
    { id, direction }: { id?: string; direction?: -1 | 1 }
  ) => {
    const { rotateFocus } = this.props
    const { highlightedOptionId } = this.state

    // if id exists, use that
    let highlightId = this.getPageChildById(id) ? id : undefined

    if (!highlightId) {
      if (!highlightedOptionId) {
        // nothing highlighted yet, highlight first option
        highlightId = this.activeOptionIds[0]
      } else if (direction) {
        // if it has direction, find next id based on it
        const index = this.activeOptionIds.indexOf(highlightedOptionId)
        const newIndex = index + direction

        highlightId = index > -1 ? this.activeOptionIds[newIndex] : undefined

        if (rotateFocus) {
          const lastOptionsIndex = this.activeOptionIds.length - 1

          if (newIndex < 0) {
            highlightId = this.activeOptionIds[lastOptionsIndex]
          }
          if (newIndex > lastOptionsIndex) {
            highlightId = this.activeOptionIds[0]
          }
        }
      }
    }

    if (highlightId) {
      // only highlight if id exists as a valid option
      this.setState({ highlightedOptionId: highlightId }, () => {
        this.focusOption(highlightId!)
      })
    }
  }

  focusOption(id: string) {
    const container = this._containerElement

    const optionElement = container?.querySelector(
      `[id="${id}"]`
    ) as HTMLSpanElement

    optionElement?.focus()
  }

  // It goes to the page and also returns the new and old pageIds
  public goToPage = (newPageId: string) => {
    if (!newPageId) {
      warn(false, `Cannot go to page because there was no page id provided.`)
      return undefined
    }

    if (!this.pageMap?.[newPageId]) {
      warn(
        false,
        `Cannot go to page because page with id: "${newPageId}" doesn't exist.`
      )
      return undefined
    }

    // the current, last page will be the "prevPage"
    const prevPageId = this._pageHistory[this._pageHistory.length - 1]
    const idxInHistory = this._pageHistory.indexOf(newPageId)

    if (idxInHistory < 0) {
      // if it is not in the page history, we have to add it
      this._pageHistory.push(newPageId)
    } else {
      // if it was already in the history, we go back to that page,
      // and clear the rest from the history
      this._pageHistory.splice(idxInHistory + 1, this._pageHistory.length - 1)
    }

    this.setState(
      {
        activePageId: newPageId,
        highlightedOptionId: undefined
      },
      () => {
        this.focus()
      }
    )

    return { prevPageId, newPageId }
  }

  public goToPreviousPage = () => {
    if (!this.previousPage) {
      warn(
        false,
        `There is no previous page to go to. The current page history is: ${this._pageHistory}.`
      )
      return undefined
    }

    // If there is a previous page, goToPage will succeed and return the data
    const { newPageId, prevPageId } = this.goToPage(this.previousPage.id)!
    return { newPageId, prevPageId }
  }

  handleBackButtonClick = () => {
    const { onBackButtonClicked } = this.props

    // we only display the back button when there is a page to go back to
    const { newPageId, prevPageId } = this.goToPreviousPage()!

    if (typeof onBackButtonClicked === 'function') {
      onBackButtonClicked(newPageId, prevPageId)
    }
  }

  handleGroupOptionSelected(
    event: React.SyntheticEvent,
    selectedOption: MappedOption
  ) {
    const { id: optionId, value } = selectedOption.props
    const {
      id: groupId,
      selectableType,
      onSelect: groupOnSelect
    } = selectedOption.groupProps!

    const { onSelect } = this.props

    if (this._selectedGroupOptionIds[groupId].has(optionId)) {
      this._selectedGroupOptionIds[groupId].delete(optionId)
    } else {
      if (selectableType === 'multiple') {
        // "checkbox"
        this._selectedGroupOptionIds[groupId].set(optionId, value)
      } else if (selectableType === 'single') {
        // "radio"
        this._selectedGroupOptionIds[groupId] = new Map()
        this._selectedGroupOptionIds[groupId].set(optionId, value)
      }
    }

    // needed for rerender
    this.setState({ lastSelectedId: optionId })

    const { groupProps, ...option } = selectedOption
    const selectedOptionValuesInGroup = Array.from(
      this._selectedGroupOptionIds[groupId].values()
    )

    if (typeof groupOnSelect === 'function') {
      groupOnSelect(
        event,
        selectedOptionValuesInGroup,
        this._selectedGroupOptionIds[groupId].has(optionId),
        option
      )
    }

    if (typeof onSelect === 'function') {
      onSelect(
        event,
        selectedOptionValuesInGroup,
        this._selectedGroupOptionIds[groupId].has(optionId),
        option
      )
    }
  }

  handleOptionSelect = (
    event: React.SyntheticEvent,
    { id }: { id?: string }
  ) => {
    const selectedOption = this.getPageChildById(id)

    if (!id || !selectedOption) {
      return
    }

    const { shouldHideOnSelect, onSelect } = this.props

    const { groupProps, ...selectedOptionChild } = selectedOption
    const { subPageId, value, onOptionClick } = selectedOptionChild.props

    if (typeof onOptionClick === 'function') {
      onOptionClick(event, id)
    }

    if (subPageId) {
      this.goToPage(subPageId)
    }

    if (groupProps?.selectableType) {
      this.handleGroupOptionSelected(event, selectedOption)
    } else {
      if (typeof onSelect === 'function') {
        onSelect(event, value, true, selectedOptionChild)
      }
    }

    if (shouldHideOnSelect && !subPageId && id !== this._headerBackId) {
      this.hide(event as React.UIEvent)
    }
  }

  renderList(
    getOptionProps: SelectableRender['getOptionProps'],
    getDisabledOptionProps: SelectableRender['getDisabledOptionProps']
  ) {
    const { currentPage, headerChildren } = this

    if (!currentPage) {
      return null
    }

    const pageChildren: PageChildren[] = [
      ...headerChildren,
      ...currentPage.children
    ]

    // for tracking if the last item was a Separator or not
    let lastItemWasSeparator = false

    return pageChildren.map((child, index) => {
      // ---RENDER GROUP---
      if (matchComponentTypes<GroupChild>(child, [DrilldownGroup])) {
        const isFirstChild = index === 0
        const isLastChild = index === currentPage?.children.length - 1
        const afterSeparator = lastItemWasSeparator

        const needsFirstSeparator = this.hasGroupFirstSeparator(child, {
          isFirstChild,
          isLastChild,
          afterSeparator
        })
        const needsLastSeparator = this.hasGroupLastSeparator(child, {
          isFirstChild,
          isLastChild,
          afterSeparator
        })

        lastItemWasSeparator = needsLastSeparator

        return this.renderGroup(
          child,
          getOptionProps,
          getDisabledOptionProps,
          // for rendering separators appropriately
          needsFirstSeparator,
          needsLastSeparator
        )

        // ---RENDER SEPARATOR---
      } else if (
        matchComponentTypes<SeparatorChild>(child, [DrilldownSeparator])
      ) {
        // if the last item was separator, we don't want to duplicate it
        if (lastItemWasSeparator) {
          return null
        }
        lastItemWasSeparator = true
        return this.renderSeparator(child)

        // ---RENDER OPTION---
      } else {
        lastItemWasSeparator = false
        return this.renderOption(child, getOptionProps, getDisabledOptionProps)
      }
    })
  }

  renderPage() {
    const {
      styles,
      overflowY,
      overflowX,
      height,
      width,
      maxHeight,
      maxWidth,
      trigger,
      label,
      onKeyUp,
      onKeyDown
    } = this.props

    if (!this.currentPage) {
      return null
    }

    const labelledBy = this.props['aria-labelledby']
    const controls = this.props['aria-controls']

    return (
      <Selectable
        isShowingOptions={this.shown}
        highlightedOptionId={this.state.highlightedOptionId}
        selectedOptionId={this.selectedGroupOptionIds}
        onRequestShowOptions={this.show}
        onRequestHideOptions={this.hide}
        onRequestSelectOption={this.handleOptionSelect}
        onRequestHighlightOption={this.handleOptionHighlight}
        onRequestHighlightFirstOption={(event) => {
          const firstOptionId = this.activeOptionIds[0]
          this.handleOptionHighlight(event, { id: firstOptionId })
        }}
        onRequestHighlightLastOption={(event) => {
          const lastOptionId =
            this.activeOptionIds[this.activeOptionIds.length - 1]
          this.handleOptionHighlight(event, { id: lastOptionId })
        }}
      >
        {({
          // TODO: figure out what other Selectable props we need:
          // getRootProps, - we probably don't need this
          // getLabelProps, - do we need label?
          // getDescriptionProps, - might be nice for assistiveText like in Select
          // getInputProps, - hidden input for a11y? role="combobox" might be needed
          getTriggerProps,
          getListProps,
          getOptionProps,
          getDisabledOptionProps
        }) => (
          <View
            as="div"
            elementRef={this.handleRef}
            tabIndex={0}
            css={styles?.drilldown}
            position="relative"
            borderRadius="small"
            width={width}
            maxWidth={maxWidth}
            {...getTriggerProps({
              // role: '?', TODO: role??
              'aria-label': label,
              'aria-controls': controls,
              'aria-labelledby':
                labelledBy || (trigger ? this._labelId : undefined),
              onKeyDown: (event) => {
                onKeyDown?.(event as React.KeyboardEvent<HTMLDivElement>)
              },
              onKeyUp: (event) => {
                onKeyUp?.(event as React.KeyboardEvent<HTMLDivElement>)
              },
              onBlur: (event: React.FocusEvent) => {
                const target = event.currentTarget
                const related = event.relatedTarget
                const containsRelated = contains(
                  target as Node | Window,
                  related as Node | Window
                )

                if (
                  !related ||
                  related === this._drilldownRef ||
                  (related !== target && !containsRelated)
                ) {
                  this.setState({ highlightedOptionId: undefined })
                }
              },
              onMouseLeave: () => {
                this.setState({ highlightedOptionId: undefined })
              }
            })}
          >
            <View
              as="div"
              overflowY={overflowY}
              overflowX={overflowX}
              height={height}
              width={width}
              maxHeight={maxHeight}
              maxWidth={maxWidth}
              css={styles?.container}
              borderRadius="small"
              elementRef={(element) => {
                this._containerElement = element as HTMLDivElement
              }}
            >
              <Options
                {...getListProps()}
                as="div"
                elementRef={(element) => {
                  this._optionsElement = element as HTMLDivElement
                }}
              >
                {this.renderList(getOptionProps, getDisabledOptionProps)}
              </Options>
            </View>
          </View>
        )}
      </Selectable>
    )
  }

  handleToggle = (shown: boolean) => {
    const { goToPage, goToPreviousPage } = this
    const { onToggle } = this.props

    this.setState({ isShowingPopover: shown })

    // we make a copy of the array so the original history
    // cannot be modified from the outside
    const pageHistory = [...this._pageHistory]

    // TODO: make an example for onToggle navigation (how to use goToPage etc.)
    if (typeof onToggle === 'function') {
      onToggle({
        shown,
        drilldown: this,
        pageHistory,
        goToPage,
        goToPreviousPage
      })
    }
  }

  render() {
    // clear temporary option store
    this._activeOptionsMap = {}

    const {
      show,
      defaultShow,
      placement,
      withArrow,
      shouldContainFocus,
      shouldReturnFocus,
      trigger,
      mountNode,
      popoverRef,
      isDisabled,
      onDismiss,
      onFocus,
      onMouseOver,
      offsetX,
      offsetY
    } = this.props

    return trigger ? (
      <Popover
        isShowingContent={show}
        defaultIsShowingContent={defaultShow}
        shouldCloseOnDocumentClick={true}
        onHideContent={(event, { documentClick }) => {
          if (typeof onDismiss === 'function') {
            onDismiss(event, documentClick)
          }
          this.reset()
          this.handleToggle(false)
        }}
        onShowContent={() => this.handleToggle(true)}
        mountNode={mountNode}
        placement={placement}
        withArrow={withArrow}
        shouldContainFocus={shouldContainFocus}
        shouldReturnFocus={shouldReturnFocus}
        id={this._id}
        on={['click']}
        onFocus={onFocus}
        onMouseOver={onMouseOver}
        offsetX={offsetX}
        offsetY={offsetY}
        ref={(el) => {
          this._popover = el
          if (typeof popoverRef === 'function') {
            popoverRef(el)
          }
        }}
        renderTrigger={safeCloneElement(trigger as ReactElement, {
          ref: (el: (React.ReactInstance & { ref?: Element }) | null) => {
            this._trigger = el
            this.ref = el?.ref || (el as Element)
          },
          'aria-haspopup': true,
          id: this._labelId,
          disabled: (trigger as ReactElement).props.disabled || isDisabled
        })}
      >
        {this.renderPage()}
      </Popover>
    ) : (
      this.renderPage()
    )
  }
}

export default Drilldown
export { Drilldown }
