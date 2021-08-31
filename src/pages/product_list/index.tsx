import conf from "../../settings";
import type { Conf } from "../../settings.d";

export default function ProductList() {
  const products = (conf as Conf).products;
  if (products === undefined) {
    return <p>No products are configured!</p>;
  }
  const product_names = Object.keys(products);
  return (
    <div>
      <h1>Products</h1>
      {product_names.map((name) => {
        const href = `/products/${name}`;
        return (
          <p key={name}>
            <a href={href}>{name}</a>
          </p>
        );
      })}
    </div>
  );
}
