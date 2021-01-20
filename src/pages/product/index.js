import { useParams } from 'react-router-dom';
import { Async } from 'react-async';
import format from 'date-fns/format';
import differenceInDays from 'date-fns/differenceInDays';
import compareDesc from 'date-fns/compareDesc';
import coerce from 'semver/functions/coerce';
import compare from 'semver/functions/compare';
import merge from 'deepmerge';
import { DataGrid } from '@material-ui/data-grid';


import conf from '../../settings.js';
import styles from './style.module.css';

function fetchProductData ({jobs, name}) {
  if ( typeof jobs === "string" ) { jobs = [jobs] }
  console.log(`fetchProductData jobs: ${jobs}`);
  return Promise.allSettled(jobs.map(async job => {
    return fetchJobData(job)
      .then(resp => {
        if ( resp.ok ) return resp.json()
        console.error(resp.statusText);
      }).then(data => {
        return getVersions(name, data)
      })
  }))
  .then(resps => {
    const partialVersions = resps.map(item => item.value);
    let versions = mergeVersions(name, partialVersions);
    mergeVersions(name, partialVersions);
    // sort versions by their most recent build's timestamp
    const sorted = Object.keys(versions).sort((a, b) => {
      return compareDesc(
        new Date(versions[a][0].timestamp),
        new Date(versions[b][0].timestamp)
      )
    });
    return {sorted, versions}
  })
};

async function fetchJobData (job) {
  const depth = 50;
  const url = `${conf.jenkins.api_url}/job/${job}/api/json?tree=name,property[parameterDefinitions[defaultParameterValue[name,value]]],builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,result,timestamp]{0,${depth}}`;
  const headers = { Accept: "application/json" }
  const res = fetch(url, {headers});
  return res
}

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
      id: `${jobData.name}/${build.number}`,
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

const columns = [
  { field: 'timestamp',
    headerName: 'Time',
    valueFormatter: ({value}) =>
      format( new Date(value), 'yyyy-MM-dd HH:mm'),
    width: 150,
  },
  { field: 'result', headerName: 'Result', width: 125,
    valueFormatter: ({value}) => value? value: '?',
    cellClassName: params => styles[params.value? params.value.toLowerCase() : 'unknown'],
  },
  { field: 'job', headerName: 'Job', width: 150 },
  { field: 'build', headerName: 'Build' },
  { field: 'testResults', headerName: 'Tests', width: 200,
    renderCell: (params) => (<TestResults results={params.value} />)
  },
];

function Version (props) {
  const pageSize = 5;
  const pagination = (props.builds.length > pageSize);
  // Ideally minHeight would be 80, but anything under 140 seems to invoke:
  // Warning: `Infinity` is an invalid value for the `minHeight` css style
  // property.
  const minHeight = 140;
  let height = Math.max(
    minHeight,
    40 + 36 * Math.min(props.builds.length, pageSize)
  );
  if ( pagination ) height += 52;
  return (
    <div className={styles.version}>
      <h2>{props.value}</h2>
      <div style={{ height: height, width: '100%' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              rows={props.builds}
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

function TestResults (props) {
  const results = props.results;
  if ( results === undefined ) return (<div />)
  return (
    <div className={styles.testResults}>
      { results.fail? (<div>{results.fail} fail</div>) : null }
      { results.skip? (<div>{results.skip} skip</div>) : null }
      { results.pass? (<div>{results.pass} pass</div>) : null }
    </div>
  )
}

export default function Product () {
  const params = useParams();
  const name = params.product;
  console.log(`Product name: ${name}`);
  const jobs = Object.keys(conf.products[name].jobs);
  return (
    <Async promiseFn={fetchProductData} jobs={jobs} name={name}>
      <h1>Latest {name} builds</h1>
      <Async.Pending>
        <p>loading...</p>
      </Async.Pending>
      <Async.Fulfilled>
        { data => data.sorted.map(item => (
            <Version key={item} value={item} builds={data.versions[item]} />
          ))
        }
      </Async.Fulfilled>
      <Async.Rejected>
        {error => (<p>{error}</p>)}
      </Async.Rejected>
    </Async>
  )
};
