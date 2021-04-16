import { transformProductData } from '../../lib/jenkins';
import Version from '../version';

function VersionList (props) {
  const data = transformProductData({
    jobDataList: props.data,
    name: props.product,
    versionFilter: props.version,
  });
  return (
    <>
      { data.sorted.map(item => (
        <Version key={item} value={item} builds={data.versions[item]} />
      ))}
    </>
  )
}

export default VersionList;
