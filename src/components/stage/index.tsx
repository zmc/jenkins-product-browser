import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

import { usePipelineRunData } from "../../lib/jenkins";

type StageProps = {
  job: string;
  build: number;
  status: string;
  version: string;
}

interface StatusesType {
  [key: string]: string;
}

const statuses: StatusesType = {
  failure: "failed",
  running: "in_progress",
  aborted: "aborted",
};

function Stage(props: StageProps) {
  const { data, error, isLoading } = usePipelineRunData(
    props.job,
    props.build,
    statuses[props.status],
    props.version
  );
  if (error) {
    console.error(error);
    return null;
  }
  if (isLoading) {
    return (<Typography>"..."</Typography>);
  }
  if (data === undefined || !data.consoleUrl || !data.name) return null;
  return (
    <Link href={data.consoleUrl} target="_blank" rel="noopener noreferrer">
      {data.name}
    </Link>
  );
}

export default Stage;
