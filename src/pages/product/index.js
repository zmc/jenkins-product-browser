import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Async, useFetch } from 'react-async';
import format from 'date-fns/format';
import compareDesc from 'date-fns/compareDesc';
import coerce from 'semver/functions/coerce';
import compare from 'semver/functions/compare';
import merge from 'deepmerge';
import { DataGrid } from '@material-ui/data-grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Box from '@material-ui/core/Box';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import LinkIcon from '@material-ui/icons/Link';


import conf from '../../settings.js';
import styles from './style.module.css';

function fetchProductData ({jobs}) {
  if ( typeof jobs === "string" ) { jobs = [jobs] }
  console.log(`fetchProductData jobs: ${jobs}`);
  return Promise.allSettled(jobs.map(async job => {
    return fetchJobData(job)
      .then(resp => {
        if ( resp.ok ) return resp.json()
        console.error(resp.statusText);
      }).catch(error => {
        console.error(error);
        throw error;
      });
  }))
  .then(resps => {
    return resps.map(item => item.value);
  })
};

function transformProductData ({jobDataList, name}) {
  const partialVersions = jobDataList.map(item => getVersions(name, item));
  const versions = mergeVersions(name, partialVersions);
  const sorted = Object.keys(versions).sort((a, b) => {
    return compareDesc(
      new Date(versions[a][0].timestamp),
      new Date(versions[b][0].timestamp)
    )
  });
  return {sorted, versions}
}

async function fetchJobData (job) {
  const maxBuilds = conf.jenkins.max_builds || undefined;
  let url = `${conf.jenkins.api_url}/job/${job}/api/json?tree=name,property[parameterDefinitions[defaultParameterValue[name,value]]],builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,result,timestamp]`;
  if ( maxBuilds !== undefined ) { url += `{0,${maxBuilds}}` };
  const headers = { Accept: "application/json" }
  const res = fetch(url, {headers});
  return res
}

async function fetchPipelineRunData ({job, build, status}) {
  const headers = { Accept: "application/json" };
  const pipelineFetch = await fetch(
    `${conf.jenkins.api_url}/job/${job}/${build}/wfapi/`, { headers });
  const pipelineData = await pipelineFetch.json();
  const stage = pipelineData.stages.filter(
    stage => stage.status.toLowerCase() === status)[0];
  if ( stage === undefined ) { return null };
  const stageFetch = await fetch(
    `${conf.jenkins.api_url}/${stage._links.self.href}`, { headers });
  const stageData = await stageFetch.json();
  const consoleUrl = conf.jenkins.url + '/' +
    stageData.stageFlowNodes[0]._links.console.href;
  return {
    name: stage.name,
    consoleUrl,
  }
}

function getVersions (product, jobData) {
  const productSettings = conf.products[product];
  const jobSettings = productSettings.jobs[jobData.name];
  const versions = {};
  jobData.builds.forEach((build) => {
    const metadata = {
      id: `${jobData.name}/${build.number}`,
      job: jobData.name,
      jobURL: `${conf.jenkins.url}/job/${jobData.name}`,
      build: build.number,
      buildURL: `${conf.jenkins.url}/job/${jobData.name}/${build.number}`,
      status: build.building? 'running' : build.result.toLowerCase(),
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
      metadata.testResultsURL = `${metadata.buildURL}/testReport`;
    };
    if ( jobSettings.version_param ) {
      // find the action object containing parameters
      const raw_params = build.actions.filter((item) => {
        return item._class === "hudson.model.ParametersAction" })[0].parameters;
      // find the param containing the product version
      let version_param = raw_params.filter(
        item => item.name === jobSettings.version_param);
      if ( ! version_param ) { return };
      version_param = version_param[0];
      const version_regex = new RegExp(jobSettings.version_regex || ":(.+)");
      const version = version_regex.exec(version_param.value)[1];
      const version_exclude = jobSettings.version_exclude || ["latest"];
      if ( version_exclude.includes(version) ) { return };
      const xyz = coerce(version).raw;
      if ( versions[xyz] === undefined ) { versions[xyz] = {} };
      if ( versions[xyz][version] === undefined ) { versions[xyz][version] = {} };
      metadata.version = version;
      versions[xyz][version][`${jobData.name}_${build.number}`] = metadata;
    };
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
    if ( settings.max_dev_builds !== undefined ) {
      devBuilds = devBuilds.slice(0, settings.max_dev_builds);
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

function GridLink ({url, children}) {
  return (
    <Link href={url} target="_blank">
      {children}
    </Link>
  )
}

const columns = [
  { field: 'timestamp',
    headerName: 'Time',
    valueFormatter: ({value}) =>
      format( new Date(value), 'yyyy-MM-dd HH:mm'),
    width: 150,
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
  const pageSize = 5;
  const pagination = (props.builds.length > pageSize);
  // Ideally minHeight would be 80, but anything under 140 seems to invoke:
  // Warning: `Infinity` is an invalid value for the `minHeight` css style
  // property.
  const minHeight = 140;
  let height = Math.max(
    minHeight,
    50 + 36 * Math.min(props.builds.length, pageSize)
  );
  if ( pagination ) height += 52;
  function setOpen (x) {
    setContentsOpen(x) };
  return (
    <div className={styles.version}>
      <div style={{display: "flex", justifyContent: "space-between"}}>
        <Typography variant="h5" component="span" style={{padding: 5}} >{props.value}</Typography>
        <div style={{textAlign: "end"}}>
          <IconButton
            onClick={() => { setOpen(true) }}
            style={{marginTop: -5}}
          >
            <FormatListBulleted />
          </IconButton>
        </div>
      </div>
      <BuildContents open={contentsOpen} setOpen={setOpen} build={props.value} />
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


function BuildContents (props) {
  const headers = { Accept: "application/json" };
  const url = `${conf.ocs_metadata.api_url}/builds/${props.build}`;
  const { data, error, isPending } = useFetch(url, { headers });
  const { open, setOpen } = props;
  if ( isPending || error ) return null;
  return (
    <>
      <Dialog
        open={open}
        onClose={() => { setOpen(false) }}
        scroll="paper"
      >
        <DialogTitle>
          {data.version}
          <Link href={data.url} target="_blank" style={{paddingLeft: 20, verticalAlign: "text-top"}} color="inherit">
            <LinkIcon />
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
              <Typography>image: {item.image}</Typography>
              <Typography>NVR: {item.nvr}</Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Stage (props) {
  if ( ! props.status ||
       ! ["failure", "running"].includes(props.status) ) {
    return ""
  }
  const stage_status = props.status === "failure"? "failed": "in_progress";
  return (
    <Async
      promiseFn={fetchPipelineRunData}
      job={props.job}
      build={props.build}
      status={stage_status}
    >
      <Async.Fulfilled>
        {(data) => data?
          <Link
            href={data.consoleUrl}
            target="_blank"
          >{data.name}</Link> : null
        }
      </Async.Fulfilled>
      <Async.Rejected>
        {(error) => { console.error(error) }}
      </Async.Rejected>
    </Async>
  )
}

function TestResults (props) {
  const results = props.results;
  if ( results === undefined ) return (<div />)
  const resultsString = Object.keys(results).map(item => {
    if ( item === "total" ) return null;
    if (results[item]) return `${results[item]} ${item}`;
    return null;
  }).filter(item => item).join(", ");
  return (
    <div className={styles.testResults}>
      <GridLink url={props.url}>
        {resultsString}
      </GridLink>
    </div>
  )
}

function VersionList (props) {
  const data = transformProductData({jobDataList: props.data, name: props.product});
  return (
    <>
      { data.sorted.map(item => (
        <Version key={item} value={item} builds={data.versions[item]} />
      ))}
    </>
  )
}

export default function Product (props) {
  const params = useParams();
  const name = params.product || props.name;
  console.log(`Product name: ${name}`);
  const jobs = Object.keys(conf.products[name].jobs);
  return (
    <Async promiseFn={fetchProductData} jobs={jobs}>
      <Typography variant="h3">Latest {name} builds</Typography>
      <Async.Pending>
        <p>loading...</p>
      </Async.Pending>
      <Async.Fulfilled>
        { data => {
            if ( ! data.every(i => i !== undefined) ) {
                return (
                  <Typography>
                    Response from Jenkins was empty.
                    This is a known issue; please try using Chrome.
                  </Typography>
                )
            }
            return (<VersionList data={data} product={name} />)
          }
        }
      </Async.Fulfilled>
      <Async.Rejected>
        {error => (<p>{error}</p>)}
      </Async.Rejected>
    </Async>
  )
};
