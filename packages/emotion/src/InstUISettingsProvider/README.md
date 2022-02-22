---
describes: InstUISettingsProvider
---

The `<InstUISettingsProvider/>` component provides a way to add global configuration to our app. It can be used to apply and handle themes (for all themeable child components that use the [withStyle](#withStyle) decorator), setting the global text direction, etc.

Note that `<InstUISettingsProvider/>` components can be nested!

Table of Contents:

- [Theme management](/#InstUISettingsProvider/#theme-management)
  - [Applying theme to the application](/#InstUISettingsProvider/#theme-management-applying-theme-to-the-application)
  - [Nesting theme providers](/#InstUISettingsProvider/#theme-management-nesting-theme-providers)
  - [Global overrides](/#InstUISettingsProvider/#theme-management-global-overrides)
  - [Theme overrides](/#InstUISettingsProvider/#theme-management-theme-overrides)
  - [Global component theme overrides](/#InstUISettingsProvider/#theme-management-global-component-theme-overrides)
- [Text direction management](/#InstUISettingsProvider/#text-direction-management)
- [Properties](/#InstUISettingsProvider/#InstUISettingsProviderProperties)

### Theme management

`<InstUISettingsProvider/>` is a wrapper for the [ThemeProvider](https://emotion.sh/docs/theming#themeprovider-reactcomponenttype) of Emotion library that we use under the hood for theming and applying css styles to our components.

#### Applying theme to the application

The `theme` prop applies the given theme. It handles either a full theme, or an overrides object. Theme properties will fall back to the parent theme, or the default `canvas` theme when they are not set.

To apply a theme to whole app, you need to import `<InstUISettingsProvider/>` and the theme you want to use from `@instructure/ui-themes` (or use your own compatible theme), and wrap your app in the theme provider.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { instructure } from '@instructure/ui-themes'
import { InstUISettingsProvider } from '@instructure/emotion'

import { App } from './App'

ReactDOM.render(
  <InstUISettingsProvider theme={instructure}>
    <App />
  </InstUISettingsProvider>,
  document.getElementById('app')
)
```

#### Nesting theme providers

```js
<InstUISettingsProvider theme={canvas}>
  <Heading>I should have "canvas" font family.</Heading>

  <InstUISettingsProvider theme={instructure}>
    <Heading>I should have "instructure" font family.</Heading>
  </InstUISettingsProvider>
</InstUISettingsProvider>
```

#### Global overrides

`<InstUISettingsProvider/>`accepts override objects too. Here you can override any theme variable inside that provider.

```js
---
example: true
---
<InstUISettingsProvider theme={canvas}>
  <div>
    <Heading level="h3" margin="small small medium">I should have default font family.</Heading>

    <InstUISettingsProvider
      theme={{
        typography: { fontFamily: 'monospace' }
      }}
    >
      <Heading level="h3" margin="small small">I should have monospace font family.</Heading>
    </InstUISettingsProvider>
  </div>
</InstUISettingsProvider>
```

#### Theme overrides

In case you are using multiple themes in your app, you can target a specific theme to override with the `themeOverrides` key, and under the name (key) of the theme.

```js
---
  example: true
---
<InstUISettingsProvider theme={canvas}>
  <div>
  <Alert variant="info" margin="small">
    I am a default style Alert.
  </Alert>

  <InstUISettingsProvider
    theme={{
      themeOverrides: {
        canvas: {
          colors: { backgroundLightest: 'orange' }
        },
        'canvas-high-contrast': {
          colors: { backgroundLightest: 'red' }
        },
        instructure: {
          colors: { backgroundLightest: 'green' }
        }
      }
    }}
  >
    <Alert variant="info" margin="small">
      My background should be:
      <List margin="xx-small">
        <List.Item><strong>orange</strong> in 'canvas',</List.Item>
        <List.Item><strong>red</strong> in 'canvas-high-contrast',</List.Item>
        <List.Item>and <strong>green</strong> in 'instructure' theme.</List.Item>
      </List>
    </Alert>
  </InstUISettingsProvider>
</div>
</InstUISettingsProvider>
```

#### Global component theme overrides

You can globally override the themeVariables of specific components too with the `componentOverrides` key.

**Important:** these variables are the components own theme variables set in the `theme.js` of the component.

The `componentOverrides` can also be nested inside `themeOverrides`.

**Note:** these overrides are handled in the `getComponentThemeOverride` style util method, not in
`InstUISettingsProvider`.

```js
---
  example: true
---
<InstUISettingsProvider theme={canvas}>
  <div>
    <Alert variant="info" margin="small">
      I am a default style Alert.
    </Alert>

    <InstUISettingsProvider
      theme={{
        componentOverrides: {
          Alert: {
            infoIconBackground: "darkblue",
            infoBorderColor: "darkblue"
          },
          [List.Item.componentId]: {
            color: "red"
          },
          'InlineList.Item': {
            color: "blue"
          }
        },
        themeOverrides: {
          canvas: {
            colors: {
              backgroundLightest: "lightgray"
            },
            componentOverrides: {
              Alert: {
                warningIconBackground: "deeppink",
                warningBorderColor: "deeppink"
              }
            },
          }
        }
      }}
    >
      <Alert variant="success" margin="small">
        My background should be light gray in 'canvas' theme.
      </Alert>

      <Alert variant="warning" margin="small">
        My background should be light gray and the icon background should be pink in 'canvas' theme.
      </Alert>

      <Alert variant="info" margin="small">
        My background should be light gray in 'canvas' theme, and the icon background should be dark blue in any theme.
      </Alert>
      <List margin="large 0">
        <List.Item>These List.Items have red color.</List.Item>
        <List.Item>These List.Items have red color.</List.Item>
        <List.Item>These List.Items have red color.</List.Item>
      </List>
      <div>
        <InlineList delimiter="pipe" margin="large 0">
          <InlineList.Item>This text should be blue</InlineList.Item>
          <InlineList.Item>10pts</InlineList.Item>
          <InlineList.Item><b>Due:</b> Oct 1, 2019</InlineList.Item>
          <InlineList.Item><Link href="#">Pipe Separator</Link></InlineList.Item>
        </InlineList>
      </div>
    </InstUISettingsProvider>
  </div>
</InstUISettingsProvider>
```

### Text direction management

The `dir` prop sets the text direction for its descendants. It affects text and bidirectional components as well.

```js
---
example: true
---
<InstUISettingsProvider dir="ltr">
  <div>LTR text</div>
  <Badge count={105} countUntil={100} margin="small medium 0 0">
    <Button>LTR Badge</Button>
  </Badge>

  <InstUISettingsProvider dir="rtl">
    <View as="div">
      <div>Nested RTL text</div>
      <Badge count={105} countUntil={100} margin="small medium 0 0">
        <Button>Nested RTL Badge</Button>
      </Badge>
    </View>
  </InstUISettingsProvider>

  <div>LTR text</div>
  <div>LTR text</div>
</InstUISettingsProvider>
```
