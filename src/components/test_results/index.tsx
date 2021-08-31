import GridLink from "../grid_link";
import styles from "./style.module.css";

type TestResultsProps = {
  results: {
    [k: string]: number
  };
  url: string;
}

function TestResults(props: TestResultsProps) {
  const results = props.results;
  if (results === undefined) return <div />;
  const resultsString = Object.keys(results)
    .map((item) => {
      if (item === "total") return null;
      if (results[item]) return `${results[item]} ${item}`;
      return null;
    })
    .filter((item) => item)
    .join(", ");
  return (
    <div className={styles.testResults}>
      <GridLink url={props.url}>{resultsString}</GridLink>
    </div>
  );
}

export default TestResults;
