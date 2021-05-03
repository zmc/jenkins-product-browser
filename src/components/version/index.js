import { useState } from 'react';

import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import Refresh from '@material-ui/icons/Refresh';

import BuildContents from '../build_contents';
import VersionDataGrid from '../version_datagrid';
import styles from './style.module.css';


function Version (props) {
  const [ contentsOpen, setContentsOpen ] = useState(false);
  const [ productBuildUrl, setProductBuildUrl ] = useState();
  const [ fetched, setFetched ] = useState();
  const short_version = props.value.split(':')[1];
  const refresh = () => { setFetched(new Date().getTime()) };
  return (
    <div className={styles.version}>
      <div style={{display: "flex", justifyContent: "space-between"}}>
        <Typography variant="h5" component="span" style={{padding: 5}} >
          <Link href={productBuildUrl} target="_blank">
            {short_version}
          </Link>
        </Typography>
        <div style={{textAlign: "end"}}>
          <IconButton
            onClick={() => { setContentsOpen(true) }}
            style={{marginTop: -5}}
          >
            <FormatListBulleted />
          </IconButton>
          <IconButton
            onClick={refresh}
            style={{marginTop: -5}}
          >
            <Refresh />
          </IconButton>
        </div>
      </div>
      <BuildContents
        open={contentsOpen}
        setOpen={setContentsOpen}
        version={short_version}
        setProductBuildUrl={setProductBuildUrl}
      />
      <VersionDataGrid
        product={props.product}
        value={props.value}
        fetched={fetched}
      />
    </div>
  )
};

export default Version;
