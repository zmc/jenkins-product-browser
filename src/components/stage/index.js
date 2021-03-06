import Link from '@material-ui/core/Link';

import { usePipelineRunData } from '../../lib/jenkins';


function Stage (props) {
  const statuses = {
    "failure": "failed",
    "running": "in_progress",
    "aborted": "aborted",
  };
  const { data, error, isLoading } = usePipelineRunData({
    job: props.job,
    build: props.build,
    status: statuses[props.status],
    version: props.version,
  });
  if ( error ) {
    console.error(error);
    return null;
  };
  if ( isLoading ) {
    return "...";
  }
  if ( data === undefined || ! data.consoleUrl || ! data.name ) return null;
  return (
    <Link
      href={data.consoleUrl}
      target="_blank"
      rel="noopener noreferrer"
    >{data.name}</Link>
  )
}

export default Stage;
