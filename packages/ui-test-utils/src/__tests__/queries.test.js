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
import { mount, expect, findAll, find, spy, wait, within } from '../index'

describe('find, findAll', async () => {
  it('throws an error message by default when nothing is found', async () => {
    expect(findAll('[selected]', { timeout: 0 })).to.be.rejected()
    expect(findAll({ css: '[selected]', timeout: 0 })).to.eventually.throw()
    expect(findAll({ label: 'pineapple', timeout: 0 })).to.eventually.throw()
    expect(findAll({ tag: 'pineapple', timeout: 0 })).to.eventually.throw()
    expect(findAll({ text: 'pineapple', timeout: 0 })).to.eventually.throw()
    expect(findAll('table', { timeout: 100 })).to.eventually.throw()
  })

  it('should return empty array when configured to expect empty results', async () => {
    const options = { expectEmpty: true }
    expect(await findAll('[selected]', options)).to.have.length(0)
    expect(await findAll({ css: '[selected]', ...options })).to.have.length(0)
    expect(await findAll({ label: 'pineapple', ...options })).to.have.length(0)
    expect(await findAll({ tag: 'pineapple', ...options })).to.have.length(0)
    expect(await findAll({ text: 'pineapple', ...options })).to.have.length(0)
    expect(await findAll({ title: 'pineapple', ...options })).to.have.length(0)
  })

  it('works with SVG elements', async () => {
    await mount(
      <svg>
        <title>Close</title>
        <g>
          <path />
        </g>
      </svg>
    )

    expect(await findAll({ title: 'Close', visible: false })).to.have.length(1)
  })

  describe('by locator', async () => {
    it('finds a single element', async () => {
      await mount(
        <div data-locator="Foo">hello world</div>
      )

      expect(await find({ locator: {
        attribute: 'data-locator',
        value: 'Foo'
      }})).to.exist()
    })

    it('finds multiple elements', async () => {
      await mount(
        <div>
          <div data-locator="Foo">hello world</div>
          <div data-locator="Foo">hello world</div>
          <div data-locator="Bar">hello world</div>
          <div data-locator="Foo">hello world</div>
        </div>
      )

      expect(await findAll({ locator: {
        attribute: 'data-locator',
        value: 'Foo'
      }})).to.have.length(3)
    })

    it('finds elements with comma separated attribute values', async () => {
      await mount(
        <div>
          <div data-locator="Foo">hello world</div>
          <div data-locator="Foo,Bar">hello world</div>
          <div data-locator="Qux,Foo,Bar,Baz">hello world</div>
          <div data-locator="Qux,Bar,Foo">hello world</div>
        </div>
      )

      expect(await findAll({ locator: {
        attribute: 'data-locator',
        value: 'Foo'
      }})).to.have.length(4)
    })

    it('does not find elements with attribute values that are substrings', async () => {
      await mount(
        <div>
          <div data-locator="FooBar">hello world</div>
          <div data-locator="Foooo">hello world</div>
          <div data-locator="FooFooFoo">hello world</div>
          <div data-locator="Baz,FooBar,QuxFoo,Fooo">hello world</div>
        </div>
      )

      expect(await findAll({
        locator: {
          attribute: 'data-locator',
          value: 'Foo'
        },
        expectEmpty: true
      })).to.have.length(0)
    })
  })

  describe('by text', async () => {
    it('can get elements by matching their text content', async () => {
      await mount(
        <div data-locator="TestLocator">
          <span>Currently showing</span>
          <span>
            {`Step
            1
              of 4`}
          </span>
        </div>
      )

      expect(await findAll({ text: 'Currently showing' })).to.have.length(1)
      expect(await findAll({ text: 'Step 1 of 4' })).to.have.length(1)
    })

    it('can get elements by matching their nested contents', async () => {
      await mount(
        <div>
          <span>Currently showing</span>
        </div>
      )

      expect(await findAll({
        contains: 'Currently showing'
      }))
        .to.have.length(3) // div (mount node), div, span
    })

    it('should filter out non-matching results', async () => {
      await mount(
        <div data-locator="TestLocator">
          <span>Currently showing</span>
        </div>
      )

      expect(await findAll({
        css: '[data-locator="TestLocator"]',
        text: 'Foo',
        expectEmpty: true
      })).to.have.length(0)
    })

    it('can get elements by matching their text across adjacent text nodes', async () => {
      const div = document.createElement('div')
      const textNodeContent = ['£', '24', '.', '99']
      textNodeContent
        .map(text => document.createTextNode(text))
        .forEach(textNode => div.appendChild(textNode))

      const subject = await mount(<div />)
      subject.getDOMNode().appendChild(div)

      const nodes = await findAll({
        text: '£24.99'
      })

      expect(nodes).to.have.length(1)
    })

    it('matches case with RegExp matcher', async () => {
      await mount(<span>STEP 1 of 4</span>)
      expect(await findAll({ text: /STEP 1 of 4/ })).to.have.length(1)
      expect(await findAll({ text: /Step 1 of 4/, expectEmpty: true }))
        .to.have.length(0)
    })
  })

  describe('by label', async () => {
    it('can find an input with an aria-labelledby attribute', async () => {
      /* eslint-disable jsx-a11y/label-has-associated-control */
      await mount(
        <div>
          <label id="name-label">Name</label>
          <input aria-labelledby="name-label" id="name-id" />
        </div>
      )
      /* eslint-enable jsx-a11y/label-has-associated-control */
      expect(await findAll({ label: 'Name' })).to.have.length(1)
    })

    it('can find an input with a complex aria-labelledby attribute', async () => {
      /* eslint-disable jsx-a11y/label-has-associated-control */
      await mount(
        <div>
          <label id="name-label-one">Name</label>
          <span id="name-label-two">(Last, First)</span>
          <input aria-labelledby="name-label-one name-label-two" id="name-id" />
        </div>
      )
      /* eslint-enable jsx-a11y/label-has-associated-control */
      expect(await findAll({ label: 'Name' })).to.have.length(1)
      expect(await findAll({ label: '(Last, First)' })).to.have.length(1)
    })

    it('can find an input with an id via the for attribute', async () => {
      await mount(
        <div>
          <div>
            <label htmlFor="first.id">First name</label>
            <input id="first.id" />
          </div>
          <div>
            <label htmlFor="last-id"><span>Last name</span></label>
            <input id="last-id" />
          </div>
        </div>
      )
      expect(await findAll({ label: 'First name' })).to.have.length(1)
      expect(await findAll({ label: 'Last name' })).to.have.length(1)
    })

    it('can find an input with an id via a for attribute', async () => {
      await mount(
        <div>
          <label htmlFor="name-id">Name</label>
          <input id="name-id" />
        </div>
      )
      expect(await findAll({ label: 'Name' })).to.have.length(1)
    })

    it('can find an input nested in a label', async () => {
      await mount(<label>Name<input /></label>)
      expect(await findAll({ label: 'Name' })).to.have.length(1)
    })

    it('handles a label with no form control', async () => {
      // eslint-disable-next-line jsx-a11y/label-has-associated-control
      await mount(<label>First name</label>)
      expect(await find({ label: /name/, expectEmpty: true }))
        .to.be.null()
    })

    it('handles a totally empty label', async () => {
      // eslint-disable-next-line jsx-a11y/label-has-associated-control
      await mount(<label />)
      expect(await find({ label: ' ', expectEmpty: true }))
        .to.be.null()
    })

    it('can find an input with an aria-label', async () => {
      await mount(<input aria-label="Name" />)
      expect(await findAll({ label: 'Name' })).to.have.length(1)
    })
  })

  describe('by title', async () => {
    it('can find an element by its title', async () => {
      await mount(
        <div>
          <span title="Ignore this" />
          <span title="Delete" />
          <span title="Ignore this as well" />
        </div>
      )

      expect(await findAll({ title: 'Delete' })).to.have.length(1)
      expect(await findAll({ title: 'Ignore', exact: false })).to.have.length(2)
    })

    it('can find an SVG element by its title', async () => {
      await mount(
        <svg>
          <title>Close</title>
          <g>
            <path />
          </g>
        </svg>
      )

      expect(await findAll({ title: 'Close', visible: false })).to.have.length(1)
    })
  })

  describe('by value', async () => {
    it('can find an element by its value', async () => {
      await mount(
        <div>
          <input type="text"/>
          <input type="text" defaultValue="Norris"/>
          <input type="text"/>
        </div>
      )
      expect(await findAll({ value: 'Norris' })).to.have.length(1)
    })
  })

  describe('by attribute', async () => {
    it('can find an element by attribute', async () => {
      await mount(
        <div>
          <input type="text"/>
          <input type="text" defaultValue="Norris"/>
          <input type="text"/>
        </div>
      )
      expect(await findAll({ tag: 'input', attribute: 'type' })).to.have.length(3)
    })
    it('can find an element by attribute name and value', async () => {
      await mount(
        <div>
          <input type="text"/>
          <input type="password" />
        </div>
      )
      expect(await findAll({ tag: 'input', attribute: { name: 'type', value: 'password' } }))
        .to.have.length(1)
    })
  })

  describe('event helpers', async () => {
    describe('#focus', async () => {
      it('should programmtically move focus', async () => {
        await mount(
          <button>hello</button>
        )
        const button = await find({ tag: 'button' })
        await button.focus()
        expect(button.focused()).to.be.true()
      })
      it('should support initializing the event object', async () => {
        const handleFocus = spy((e) => {
          e.persist() // so that we can get the native event later
        })

        await mount(
          <button onFocus={handleFocus}>hello</button>
        )

        const button = await find({ focusable: true })

        await button.focus({ bubbles: true })

        const nativeEvent = handleFocus.getCall(0).args[0].nativeEvent

        expect(nativeEvent.bubbles).to.be.true()
      })
    })
    describe('#click', async () => {
      it('should support spies on event methods', async () => {
        const handleClick = spy((e) => {
          e.persist() // so that we can get the native event later
          e.preventDefault()
        })

        const subject = await mount(
          <button onClick={handleClick}>hello</button>
        )

        const button = within(subject.getDOMNode())

        const event = await button.click()

        await wait(() => {
          expect(event.preventDefault).to.have.been.calledOnce()
        })
      })
    })
  })
})