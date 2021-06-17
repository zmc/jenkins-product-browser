import axios from 'axios';
import { useQuery } from 'react-query';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

import conf from '../../settings.js';
import Image from '../image';


function BuildContentsInner (props) {
  const url = `${conf.ocs_metadata.api_url}/builds/${props.version}`;
  const { data, error, isLoading } = useQuery(
    ['ocs_metadata', url],
    () => axios.get(url).then(resp => resp.data),
  );
  if ( isLoading || error ) return null;
  return (
    <>
      <DialogTitle>
        <Link
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{paddingLeft: 20, verticalAlign: "text-top"}}
        >
          {data.version}
        </Link>
      </DialogTitle>
      <DialogContent>
        { data.contents.map((item) => (
          <Box
            key={item.name}
            style={{overflow: "visible", marginBottom: 20}}
          >
            <Typography variant="h6">{item.name}</Typography>
            <Typography>tag: {item.tag}</Typography>
            <Image data={item.image} />
            <Typography>NVR: {item.nvr}</Typography>
          </Box>
        ))}
      </DialogContent>
    </>
  )
}


function BuildContents (props) {
  const { open, setOpen } = props;
  return (
    <>
      <Dialog
        open={open}
        onClose={() => { setOpen(false) }}
        scroll="paper"
      >
        <BuildContentsInner version={props.version} />
      </Dialog>
    </>
  )
}

export default BuildContents;
