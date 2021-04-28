import { useEffect } from 'react';
import { useFetch } from 'react-async';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

import conf from '../../settings.js';
import Image from '../image';


function BuildContentsInner (props) {
  const headers = { Accept: "application/json" };
  const url = `${conf.ocs_metadata.api_url}/builds/${props.version}`;
  const { data, error, isPending } = useFetch(url, { headers });
  useEffect(() => {
    if (data === undefined ) { return };
    props.setData(data);
  }, [props, data])
  if ( isPending || error ) return null;
  return (
    <>
      <DialogTitle>
        <Link
          href={data.url}
          target="_blank"
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
  const setData = (data) => {
    props.setProductBuildUrl(data.url);
  };
  return (
    <>
      <Dialog
        open={open}
        onClose={() => { setOpen(false) }}
        scroll="paper"
      >
        <BuildContentsInner version={props.version} setData={setData} />
      </Dialog>
    </>
  )
}

export default BuildContents;
