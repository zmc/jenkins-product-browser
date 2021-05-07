import { Async } from 'react-async';

import Link from '@material-ui/core/Link';

import { fetchPipelineRunData } from '../../lib/jenkins';


function Stage (props) {
  const statuses = {
    "failure": "failed",
    "running": "in_progress",
    "aborted": "aborted",
  };
  if ( ! props.status || statuses[props.status] === undefined ) {
    return ""
  }
  return (
    <Async
      promiseFn={fetchPipelineRunData}
      job={props.job}
      build={props.build}
      status={statuses[props.status]}
    >
      <Async.Fulfilled>
        {(data) => data?
          <Link
            href={data.consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >{data.name}</Link> : null
        }
      </Async.Fulfilled>
      <Async.Rejected>
        {(error) => { console.error(error) }}
      </Async.Rejected>
    </Async>
  )
}

export default Stage;
