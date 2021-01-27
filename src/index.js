import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { BrowserRouter as Router } from 'react-router-dom';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

function useDarkMode () {
  const systemDarkMode = useMediaQuery(
    '(prefers-color-scheme: dark)',
  );
  const [state, setState] = useState({system: systemDarkMode});
  if ( state.user === undefined && systemDarkMode === true ) { setState({system: true, user: true}) };

  function setDarkMode (value) {
    const newState = {...state, user: value};
    //if ( value !== state.user ) { setState(newState) };
    setState(newState);
  };
  const darkMode = state.user
  return [darkMode, setDarkMode]
}

function Root () {
  const [darkMode, setDarkMode] = useDarkMode();
  const paletteType = darkMode? 'dark' : 'light';
  const toggleDarkMode = () => {
    setDarkMode(! darkMode);
  };
  if ( darkMode === undefined ) { return null };

  const getTheme = () => {
    const theme = createMuiTheme({palette: {type: paletteType}});
    if ( darkMode ) theme.palette.background.default = "#181818";
    return theme
  }
  const theme = getTheme();
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <App darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </Router>
    </ThemeProvider>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
  , document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
