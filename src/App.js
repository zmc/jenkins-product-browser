import { useMemo } from 'react';
import { Route } from 'react-router-dom';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import './App.css';
import ProductList from './pages/product_list';
import Product from './pages/product';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
      <CssBaseline />
        <header className="App-header">
        </header>
        <div className="main">
          <Route path="/" exact>
            <Product name="ocs" />
          </Route>
          <Route path="/products" exact>
            <ProductList />
          </Route>
          <Route path="/products/:product">
            <Product />
          </Route>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default App;
