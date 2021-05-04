import { Switch, Route } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import Link from '@material-ui/core/Link';
import GitHubIcon from '@material-ui/icons/GitHub';


import './App.css';
import ProductList from './pages/product_list';
import Product from './pages/product';

function App(props) {
  return (
    <div className="App">
      <AppBar position="static">
        <div
          style={{marginLeft: "auto", marginRight: 12}}
        >
        <IconButton
          onClick={props.toggleDarkMode}
        >
          { props.darkMode? <Brightness7Icon /> : <Brightness4Icon /> }
        </IconButton>
        <Link
          href="https://github.com/zmc/jenkins-product-browser"
          target="_blank"
        >
          <IconButton>
            <GitHubIcon />
          </IconButton>
        </Link>
        </div>
      </AppBar>
      <div className="main">
        <Switch>
          <Route path="/" exact>
            <Product name="OCS" />
          </Route>
          <Route path="/products" exact>
            <ProductList />
          </Route>
          <Route path="/products/:product/:version">
            <Product />
          </Route>
          <Route path="/products/:product">
            <Product />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default App;
