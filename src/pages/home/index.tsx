import { Link as RouterLink } from "react-router-dom";
import Card from "@material-ui/core/Card";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

import conf from "../../settings";
import { getProductSettings } from "../../lib/jenkins";
import type { Conf } from "../../settings";

type ProductCardProps = {
  name: string;
}

function ProductCard(props: ProductCardProps) {
  const jobs = Object.keys(getProductSettings(props.name).jobs);
  return (
    <Card style={{ minWidth: 275, padding: "10px" }} key={props.name}>
      <Typography variant="h4" style={{ textAlign: "center" }}>
        {props.name}
      </Typography>
      <Typography>
        Validation jobs:{" "}
        {jobs.map((item) => {
          return (
            <span style={{ padding: "0 5px" }} key={item}>
              <Link
                href={`${(conf as Conf).jenkins.url}/job/${item}`}
                target="_blank"
                key={item}
              >
                {item}
              </Link>
            </span>
          );
        })}
      </Typography>
      <Link component={RouterLink} to={`/products/${props.name}/`}>
        <Typography>Development Version Status</Typography>
      </Link>
      <Link component={RouterLink} to={`/products/${props.name}/builds`}>
        <Typography>Latest Build Status</Typography>
      </Link>
    </Card>
  );
}

export default function Home() {
  const products = Object.keys((conf as Conf).products);
  return (
    <>
      <Typography variant="h3" style={{ textAlign: "center", margin: "20px" }}>
        Products
      </Typography>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {products.map((product) => (
          <ProductCard key={product} name={product} />
        ))}
      </div>
    </>
  );
}
