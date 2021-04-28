import { useParams } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';

import VersionList from '../../components/version_list';

export default function Product (props) {
  const { product, version } = useParams();
  const name = product || props.name;
  return (
    <>
      <Typography variant="h3">Latest {name} builds</Typography>
      <VersionList product={name} version={version}/>
    </>
  )
};
