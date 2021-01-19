import { Route } from 'react-router-dom';

import './App.css';
import ProductList from './pages/product_list';
import Product from './pages/product';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <div className="main">
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
