import conf from '../../settings.js';

export default function ProductList () {
  if ( conf.products === undefined ) {
    return (
      <p>No products are configured!</p>
    )
  }
  const product_names = Object.keys(conf.products);
  return (
    <div>
    <h1>Products</h1>
    { product_names.map((name) => {
      const href = `/products/${name}`;
      return (
        <p key={name}><a href={href}>{name}</a></p>
      )
    })}
    </div>
  )
};
