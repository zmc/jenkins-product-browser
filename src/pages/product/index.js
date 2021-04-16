import { useParams } from 'react-router-dom';
import { Async } from 'react-async';
import Typography from '@material-ui/core/Typography';

import conf from '../../settings.js';
import VersionList from '../../components/version_list';
import { fetchProductData } from '../../lib/jenkins';


export default function Product (props) {
  const { product, version } = useParams();
  const name = product || props.name;
  console.log(`Product name: ${name}`);
  if ( version !== undefined ) { console.log(`Version filter: ${version}`) };
  const jobs = Object.keys(conf.products[name].jobs);
  return (
    <Async promiseFn={fetchProductData} jobs={jobs}>
      <Typography variant="h3">Latest {name} builds</Typography>
      <Async.Pending>
        <p>loading...</p>
      </Async.Pending>
      <Async.Fulfilled>
        { data => {
            if ( ! data.every(i => i !== undefined) ) {
                return (
                  <Typography>
                    Response from Jenkins was empty.
                    This is a known issue; please try using Chrome.
                  </Typography>
                )
            }
            return (<VersionList data={data} product={name} version={version}/>)
          }
        }
      </Async.Fulfilled>
      <Async.Rejected>
        {error => (<p>{error}</p>)}
      </Async.Rejected>
    </Async>
  )
};
