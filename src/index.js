import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { BrowserRouter as Router } from 'react-router-dom';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ErrorBoundary } from 'react-error-boundary';

import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  }
});

function useDarkMode () {
  const systemDarkMode = useMediaQuery(
    '(prefers-color-scheme: dark)',
  );
  const [state, setState] = useState({system: systemDarkMode});

  function setDarkMode (value) {
    const newState = {...state, user: value};
    if ( value !== state.user ) { setState(newState) };
    setState(newState);
  };
  const darkMode = state.user === undefined? systemDarkMode : state.user;
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
    if ( darkMode ) {
      theme.palette.background.default = "#181818";
      theme.palette.background.paper = "#303030";
    }
    return theme
  }
  const theme = getTheme();
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools />
          <App darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        </QueryClientProvider>
      </Router>
    </ThemeProvider>
  )
}

function ErrorDisplay({error}) {
  return (
    <div role="alert">
      <p>Whoops 🤦</p>
      <pre>{error.message}</pre>
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorDisplay}>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
  , document.getElementById('root')
);

serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
