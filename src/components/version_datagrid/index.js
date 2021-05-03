import { useAsync } from "react-async"
import format from 'date-fns/format';
import formatDistanceToNowStrict from 'date-fns/formatDistanceToNowStrict';
import intervalToDuration from 'date-fns/intervalToDuration';
import formatDuration from 'date-fns/formatDuration';

import { DataGrid } from '@material-ui/data-grid';

import { fetchProductBuilds } from '../../lib/jenkins';
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

export default function VersionDataGrid (props) {
  const { data, error, isPending } = useAsync(
    { promiseFn: fetchProductBuilds, product: props.product, version: props.value, watch: props.fetched })
  const pageSize = 5;
  let inner;
  // Ideally minHeight would be 80, but anything under 140 seems to invoke:
  // Warning: `Infinity` is an invalid value for the `minHeight` css style
  // property.
  const minHeight = 140;
  let height = 'auto';
  let pagination = false;
  if ( error ) {
    console.error(error);
    inner = null;
  } else if ( isPending ) {
    inner = (<p style={{textAlign: 'center'}}>loading...</p>);
  } else {
    pagination = (data.length > pageSize);
    height = Math.max(
      minHeight,
      50 + 36 * Math.min(data.length, pageSize)
    );
    if ( pagination ) height += 52;
    inner = (
      <DataGrid
        rows={data}
        columns={columns}
        density="compact"
        pageSize={pageSize}
        hideFooter={! pagination}
      />
    )
  }
  return (
    <div style={{ height: height, width: '100%' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flexGrow: 1 }}>
          { inner }
        </div>
      </div>
    </div>
  )
}
