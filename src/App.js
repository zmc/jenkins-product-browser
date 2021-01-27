import { Route } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';


import './App.css';
import ProductList from './pages/product_list';
import Product from './pages/product';

function App(props) {
  return (
    <div className="App">
      <AppBar position="static">
        <IconButton
          onClick={props.toggleDarkMode}
          style={{width: 24, marginLeft: "auto", marginRight: 12 }}
        >
          { props.darkMode? <Brightness7Icon /> : <Brightness4Icon /> }
        </IconButton>
      </AppBar>
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
    </div>
  );
}

export default App;
