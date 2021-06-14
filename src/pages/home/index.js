import { Link as RouterLink } from 'react-router-dom';
import Card from '@material-ui/core/Card';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

import conf from '../../settings.js';


function ProductCard (props) {
  return (
    <Card>
      <Typography variant="h4">
        {props.name}
      </Typography>
      <Link component={RouterLink} to={`/products/${props.name}/`}>
        <Typography>
          Latest builds grouped by version
        </Typography>
      </Link>
      <Link component={RouterLink} to={`/products/${props.name}/builds`}>
        <Typography>
          All latest builds
        </Typography>
      </Link>
    </Card>
  )
}

export default function Home () {
  const products = Object.keys(conf.products);
  return (
    <>
      { products.map(product => <ProductCard key={product} name={product} />) }
    </>
  )
}
