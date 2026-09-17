/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#eee7dc',
    tint: '#d3a05d',

    // Core surfaces
    background: '#172126',
    foreground: '#eee7dc',

    // Cards / elevated surfaces
    card: '#243137',
    cardForeground: '#eee7dc',

    // Primary action color (buttons, links, active states)
    primary: '#d3a05d',
    primaryForeground: '#172126',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#243137',
    secondaryForeground: '#eee7dc',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#334047',
    mutedForeground: '#aab2af',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#d3a05d',
    accentForeground: '#172126',

    // Destructive actions (delete, error states)
    destructive: '#de8578',
    destructiveForeground: '#172126',

    // Borders and input outlines
    border: '#3c484d',
    input: '#3c484d',
  },

  dark: {
    text: '#eee7dc',
    tint: '#d3a05d',
    background: '#172126',
    foreground: '#eee7dc',
    card: '#243137',
    cardForeground: '#eee7dc',
    primary: '#d3a05d',
    primaryForeground: '#172126',
    secondary: '#243137',
    secondaryForeground: '#eee7dc',
    muted: '#334047',
    mutedForeground: '#aab2af',
    accent: '#d3a05d',
    accentForeground: '#172126',
    destructive: '#de8578',
    destructiveForeground: '#172126',
    border: '#3c484d',
    input: '#3c484d',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 14,
};

export default colors;
