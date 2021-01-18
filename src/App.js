import { Route } from 'react-router-dom';

import './App.css';
import Product from './pages/product';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <Route path="/products/:product">
        <Product />
      </Route>
    </div>
  );
}

export default App;
