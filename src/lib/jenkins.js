import compareDesc from 'date-fns/compareDesc';
import coerce from 'semver/functions/coerce';
import compare from 'semver/functions/compare';
import merge from 'deepmerge';

import conf from '../settings.js';


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

function transformProductData ({jobDataList, name, versionFilter}) {
  const settings = conf.products[name];
  const maxDevBuilds = versionFilter === undefined? settings.max_dev_builds: -1;
  const partialVersions = jobDataList.map(item => getVersions(name, item));
  let versions = mergeVersions(partialVersions, maxDevBuilds);
  if ( versionFilter !== undefined ) {
    versions = Object.keys(versions)
      .filter(key => key.startsWith(versionFilter))
      .reduce((obj, key) => {
        return {...obj, [key]: versions[key]}
      }, {});
  }
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
  let url = `${conf.jenkins.api_url}/job/${job}/api/json?tree=name,property[parameterDefinitions[defaultParameterValue[name,value]]],builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,result,timestamp,duration]`;
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
  const node = stageData.stageFlowNodes.filter(
    node => node.status.toLowerCase() === status)[0];
  const consoleUrl = conf.jenkins.url + '/' +
    node._links.console.href;
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
      timestamp: build.timestamp,
      duration: build.duration,
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

function mergeVersions (partialVersions, maxDevBuilds) {
  const versions = merge.all(partialVersions);
  const flatVersions = {};
  Object.keys(versions).forEach((xyz) => {
    let devBuilds = Object.keys(versions[xyz]).sort(
      (a, b) => compare(b, a))
    if ( maxDevBuilds > 0 ) {
      devBuilds = devBuilds.slice(0, maxDevBuilds);
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

export {
  fetchProductData,
  transformProductData,
  fetchPipelineRunData,
}
