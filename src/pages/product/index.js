import { useParams } from 'react-router-dom';
import { useAsync } from 'react-async';
import format from 'date-fns/format';
import differenceInDays from 'date-fns/differenceInDays';
import compareDesc from 'date-fns/compareDesc';
import coerce from 'semver/functions/coerce';
import compare from 'semver/functions/compare';
import merge from 'deepmerge';
import { DataGrid } from '@material-ui/data-grid';


import conf from '../../settings.js';
import styles from './style.module.css';

function fetchProductData ({jobs}) {
  if ( typeof jobs === "string" ) { jobs = [jobs] }
  console.log(`useJobData jobs: ${jobs}`);
  const fetchJobData = async (job) => {
    const depth = 50;
    const url = `${conf.jenkins.api_url}/job/${job}/api/json?tree=name,property[parameterDefinitions[defaultParameterValue[name,value]]],builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,result,timestamp]{0,${depth}}`;
    const res = await fetch(url);
    if ( ! res.ok ) throw new Error(res.statusText);
    return res.json()
  };
  return Promise.allSettled(jobs.map(job => fetchJobData(job)))
};

function getVersions (product, jobData) {
  const productSettings = conf.products[product];
  const jobSettings = productSettings.jobs[jobData.name];
  const versions = {};
  // first, filter out build that are too old, if appropriate
  let builds = jobData.builds.filter((item) => {
    if ( productSettings.age_limit === undefined ) { return false };
    const delta = differenceInDays(new Date(), new Date(item.timestamp));
    return delta <= productSettings.age_limit;
  });
  builds.forEach((build) => {
    const metadata = {
      job: jobData.name,
      build: build.number,
      result: build.result,
      timestamp: build.timestamp
    };
    let testResults = build.actions.filter((item) => {
      return item._class === "hudson.tasks.junit.TestResultAction" });
    if ( testResults.length ) {
      testResults = testResults[0];
      metadata.testResults = {
        fail: testResults.failCount,
        skip: testResults.skipCount,
        total: testResults.totalCount,
        pass: testResults.totalCount - testResults.failCount - testResults.skipCount
      };
    };
    // find the action object containing parameters
    const raw_params = build.actions.filter((item) => {
      return item._class === "hudson.model.ParametersAction" })[0].parameters;
    // find the param containing the product version
    let version_param = raw_params.filter(
      item => item.name === jobSettings.version_param);
    if ( ! version_param ) { return };
    version_param = version_param[0];
    const version = jobSettings.version_xform(version_param.value);
    if ( jobSettings.version_exclude.includes(version) ) { return };
    const xyz = coerce(version).raw;
    if ( versions[xyz] === undefined ) { versions[xyz] = {} };
    if ( versions[xyz][version] === undefined ) { versions[xyz][version] = {} };
    metadata.version = version;
    versions[xyz][version][`${jobData.name}_${build.number}`] = metadata;
  })
  return versions;
};

function mergeVersions (product, partialVersions) {
  const settings = conf.products[product];
  const versions = merge.all(partialVersions);
  const flatVersions = {};
  Object.keys(versions).forEach((xyz) => {
    let devBuilds = Object.keys(versions[xyz]).sort(
      (a, b) => compare(b, a))
    if ( settings.maxDevBuilds !== undefined ) {
      devBuilds = devBuilds.slice(0, settings.maxDevBuilds);
    }
    devBuilds.forEach((version) => {
      flatVersions[version] = Object.values(versions[xyz][version]);
      flatVersions[version].sort((a, b) => {
        return compareDesc(
          new Date(a.timestamp),
          new Date(b.timestamp)
        )
      });
    });
  });
  return flatVersions
};

// <DataGrid rows={props.builds} columns={columns} />
function Version (props) {
  return (
    <div className={styles.version}>
      <h2>{props.value}</h2>
      <div className={styles.buildList}>
      { props.builds.map(item => (<Build key={`${item.job}/${item.build}`} data={item} />)) }
      </div>
    </div>
  )
};

function Build (props) {
  const data = props.data;
  const buildURL = `${conf.jenkins.url}/job/${data.job}/${data.build}`;
  const timestamp = format(
    new Date(data.timestamp),
    'yyyy-MM-dd HH:mm'
  )
  return (
    <div className={styles.build}>
      <Result value={data.result} />
      <span className={styles.timestamp}>{timestamp}</span>{' '}
      <a href={buildURL}>
        <span>{data.job}</span>#
        <span>{data.build}</span>
      </a>
      { data.testResults && <TestResults results={data.testResults} /> }
    </div>
  )
};

const columns = [
  { field: 'job', headerName: 'Job' },
  { field: 'build', headerName: 'Build' },
  { field: 'timestamp', headerName: 'Time' },
  { field: 'result', headerName: 'Result' }
];

function Result (props) {
  const status = props.value.toLowerCase();
  var text;
  if ( status === 'success' ) { text = "PASS" }
  else if ( status === 'failure' ) { text = "FAIL" }
  else { text = "????" };

  return (
    <span className={styles[status]}>{text}</span>
  )
};

function TestResults (props) {
  const results = props.results;
  return (
    <div className={styles.testResults}>
      { results.fail? (<div>{results.fail} fail</div>) : null }
      { results.skip? (<div>{results.skip} skip</div>) : null }
      { results.pass? (<div>{results.pass} pass</div>) : null }
    </div>
  )
}

export default function Product (props) {
  const params = useParams();
  const name = params.product;
  console.log(`Product name: ${name}`);
  const jobs = Object.keys(conf.products[name].jobs);
  const {data, error, isPending} = useAsync({promiseFn: fetchProductData, jobs});
  let versions = {};
  let sorted = [];
  if ( ! isPending ) {
    const partialVersions = data.map(item => item.value).map(jobData => getVersions(name, jobData));
    versions = mergeVersions(name, partialVersions);
    // sort versions by their most recent build's timestamp
    sorted = Object.keys(versions).sort((a, b) => {
      return compareDesc(
        new Date(versions[a][0].timestamp),
        new Date(versions[b][0].timestamp)
      )
    });
  }
  if ( error ) return (
    <p>error.message</p>
  )

  return (
    <>
      <h1>Latest {name} builds</h1>
      { sorted.map(item => (
        <Version key={item} value={item} builds={versions[item]} />
      )) }
    </>
  )
};
