import { useState } from 'react';
import { useAsync } from "react-async"
import format from 'date-fns/format';
import formatDistanceToNowStrict from 'date-fns/formatDistanceToNowStrict';
import intervalToDuration from 'date-fns/intervalToDuration';
import formatDuration from 'date-fns/formatDuration';

import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { DataGrid } from '@material-ui/data-grid';
import IconButton from '@material-ui/core/IconButton';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';

import { fetchProductBuilds } from '../../lib/jenkins';
import BuildContents from '../build_contents';
import GridLink from '../grid_link';
import Stage from '../stage';
import TestResults from '../test_results';
import styles from './style.module.css';


const columns = [
  { field: 'timestamp',
    headerName: 'Started',
    valueFormatter: ({value}) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    width: 150,
  },
  { field: 'duration',
    headerName: 'Duration',
    valueFormatter: (params) => {
      if (! params.value) {
        return formatDistanceToNowStrict(new Date(params.row.timestamp))
      } else {
        return formatDuration(
          intervalToDuration(
            {start: 0, end: params.value},
          ),
          {format: ['hours', 'minutes']}
        )
    }},
    width: 175,
  },
  { field: 'status', headerName: 'Status', width: 100,
    valueFormatter: ({value}) => value? value: '?',
    cellClassName: params => styles[params.value? params.value.toLowerCase() : 'unknown'],
  },
  { field: 'job_', headerName: 'Job', width: 150,
    renderCell: (params) => (
      <GridLink
       params={params}
       url={params.row.jobURL}
      >{params.row.job}</GridLink>
    ),
  },
  { field: 'build_', headerName: 'Build',
    renderCell: (params) => (
      <GridLink
       params={params}
       url={params.row.buildURL}
      >{params.row.build}</GridLink>
    ),
    //valueGetter: (params) => params.getValue('buildURL'),
  },
  { field: 'stage', headerName: 'Stage', width: 200,
    renderCell: (params) => (
      <Stage
        job={params.row.job}
        build={params.row.build}
        status={params.row.status}
      />
    )
  },
  { field: 'testResults', headerName: 'Tests', width: 200,
    renderCell: (params) => (
      <TestResults
       results={params.getValue("testResults")}
       url={params.row.testResultsURL}
      />
    ),
  },
];

function Version (props) {
  const [ contentsOpen, setContentsOpen ] = useState(false);
  const [ productBuildUrl, setProductBuildUrl ] = useState();
  const { data, error, isPending } = useAsync(
    { promiseFn: fetchProductBuilds, product: props.product, version: props.value})
  if ( error ) {
    console.error(error);
    return null;
  }
  if ( isPending ) {
    return (<p>loading...</p>);
  }
  const short_version = props.value.split(':')[1];
  const pageSize = 5;
  const pagination = (data.length > pageSize);
  // Ideally minHeight would be 80, but anything under 140 seems to invoke:
  // Warning: `Infinity` is an invalid value for the `minHeight` css style
  // property.
  const minHeight = 140;
  let height = Math.max(
    minHeight,
    50 + 36 * Math.min(data.length, pageSize)
  );
  if ( pagination ) height += 52;
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
        </div>
      </div>
      <BuildContents
        open={contentsOpen}
        setOpen={setContentsOpen}
        version={short_version}
        setProductBuildUrl={setProductBuildUrl}
      />
      <div style={{ height: height, width: '100%' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              rows={data}
              columns={columns}
              density="compact"
              pageSize={pageSize}
              hideFooter={! pagination}
            />
          </div>
        </div>
      </div>
    </div>
  )
};

export default Version;
