---
title: Using theme overrides
category: Guides
order: 4
---

## Using theme overrides

### How theming works in InstUI

The theming system in InstUI has two levels:

**The global theme**
On the broader level, there is the main theme object that contains the color, spacing, typography etc. variables available in the theme (e.g.: [canvas theme](/#canvas)). The global theme can be set via the [InstUISettingsProvider](/#InstUISettingsProvider) component.

**The component's own theme**
Every themeable component has its own "theme map". This map defines the components own theme variables (used by this component only), and maps them to values in the global theme object. These local variables are then passed to the component and used in the styles object.

See the [emotion](/#emotion) docs page for more info and examples.

```jsx
// app/component root sets the global theme
;<InstUISettingsProvider theme={canvas}>
  <ExampleComponent />
</InstUISettingsProvider>

// component's `theme.js` maps the
const generateComponentTheme = (theme) => {
  const { colors } = theme // global theme, e.g.: canvas theme

  return {
    background: colors?.backgroundMedium,
    color: colors?.textDarkest
    //...
  }
}

// component's `style.js` uses the theme variables
const generateStyle = (componentTheme) => {
  return {
    button: {
      label: 'button',
      background: componentTheme.background,
      color: componentTheme.color
      //...
    }
  }
}
```
