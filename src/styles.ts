export const GRID_CSS = `
[data-decky-grid="container"] {
  display: grid !important;
  grid-template-columns: repeat(var(--decky-grid-columns, 3), minmax(0, 1fr)) !important;
  gap: 8px !important;
}

[data-decky-grid="row"],
[data-decky-grid="wrapper"] {
  box-sizing: border-box !important;
  min-width: 0 !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

[data-decky-grid="button"] {
  box-sizing: border-box !important;
  width: 100% !important;
  min-width: 0 !important;
  min-height: 96px !important;
  height: 100% !important;
  padding: 12px 4px !important;
  white-space: normal !important;
  position: relative;
}

[data-decky-grid="content"] {
  position: relative;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  min-width: 0;
  width: 100%;
}

[data-decky-grid="content"] > svg,
[data-decky-grid="content"] > img {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

[data-decky-grid="label"] {
  width: 100%;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  white-space: normal !important;
  overflow-wrap: anywhere;
}

[data-decky-grid="badge"] {
  top: 0 !important;
  right: 0 !important;
}

[data-decky-grid="footer"] {
  grid-column: 1 / -1;
  position: static !important;
}
`;
