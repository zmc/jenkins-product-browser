import { useParams } from 'react-router-dom';

import Typography from '@material-ui/core/Typography';

import { useVersionLists } from '../../lib/jenkins';
import Version from '../version';


function VersionList (props) {
  const { version } = useParams();
  const { data, error, isLoading } = useVersionLists(
    { product: props.product, versionFilter: version })
  if ( error ) {
    return (
      <div>
        <p />
        <Typography>
          Failed to fetch data from Jenkins! Please try again later.
        </Typography>
      </div>
    )
  };
  if ( isLoading ) { return null };
  return (
    <>
      { data.map(item => (
        <Version key={item} value={item} product={props.product}/>
      ))}
    </>
  )
}

export default VersionList;
