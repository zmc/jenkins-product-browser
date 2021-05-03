import { useAsync } from "react-async"
import { useParams } from 'react-router-dom';

import { fetchVersionLists } from '../../lib/jenkins';
import Version from '../version';


function VersionList (props) {
  const { version } = useParams();
  const { data, error, isPending } = useAsync(
    { promiseFn: fetchVersionLists, product: props.product, versionFilter: version })
  if ( error ) {
    console.error(error);
    return <p>error!</p>
  };
  if ( isPending ) { return null };
  return (
    <>
      { data.map(item => (
        <Version key={item} value={item} product={props.product}/>
      ))}
    </>
  )
}

export default VersionList;
