import coerce from 'semver/functions/coerce';
import convert from 'xml-js';

import conf from '../settings.js';


function getProductSettings (product) {
  const matches = Object.keys(conf.products).filter(key => {
    return key.toLowerCase() === product.toLowerCase();
  });
  if ( matches.length ) return conf.products[matches[0]];
};

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

async function fetchVersionLists ({product, versionFilter}) {
  const productSettings = getProductSettings(product);
  const jobs = Object.keys(productSettings.jobs);
  return Promise.all(jobs.map(async job => {
    const jobSettings = productSettings.jobs[job];
    return fetchVersionList(job, jobSettings.version_param)
  }))
  .then(values => {
    return Array.from(new Set(values.flat()));
  })
  .then(versionList => {
    const newList = transformVersionList({product, versionList, versionFilter})
    return newList;
  })
};

async function fetchXML (url) {
  return fetch(url)
    .then(resp => {
      if ( resp.ok ) return resp.text();
    }).then(xml => {
        return convert.xml2json(xml, {compact: true, nativeType: true});
    }).then(json => {
      return JSON.parse(json);
    });
}

async function fetchVersionList (job, version_param) {
  const url = `${conf.jenkins.api_url}/job/${job}/api/xml?tree=builds[number,actions[parameters[name,value]]]&wrapper=root&xpath=//*/build/action/parameter[name[text()='${version_param}']]/value`;
  return fetchXML(url)
    .then(data => {
      return data.root.value.map(item => item._text);
    });
}

function transformVersionList ({product, versionList, versionFilter}) {
  if ( versionFilter !== undefined ) {
    versionList = versionList.filter(item => {
      return item.split(':')[1].startsWith(versionFilter);
    });
  }
  const versionObj = versionList.reduce((accumulator, currentValue) => {
    const semVer = coerce(currentValue);
    if ( accumulator[semVer] === undefined ) { accumulator[semVer] = []; };
    accumulator[semVer].push(currentValue);
    return accumulator;
  }, {});
  const settings = conf.products[product];
  const maxDevBuilds = versionFilter === undefined? (settings.max_dev_builds || 0): -1;
  Object.entries(versionObj).forEach(([semVer, subList]) => {
    subList.sort().reverse();
    if ( maxDevBuilds > 0 ) {
      versionObj[semVer] = subList.slice(0, maxDevBuilds);
    }
  });
  return Object.values(versionObj).flat().sort().reverse();
}

function fetchProductBuilds ({product, version}) {
  const productSettings = getProductSettings(product);
  const jobs = Object.keys(productSettings.jobs);
  return Promise.allSettled(jobs.map(async job => {
    const version_param = productSettings.jobs[job].version_param
    return fetchBuilds({job, version_param, version})
  }))
  .then(resps => {
    const lists = resps.map(item => item.value).filter(item => item !== undefined);
    return Array.from(new Set(lists.flat()));
  }).then(builds  => {
    return builds.map(getTestBuildMetadata);
  })
};

async function fetchBuilds ({job, version_param, version}) {
  const url = `${conf.jenkins.api_url}/job/${job}/api/xml?tree=name,builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,duration,result,timestamp]&wrapper=root&xpath=//*/build[action/parameter[name[text()='${version_param}']%20and%20value[text()='${version}']]]`;
  return fetchXML(url)
    .then(data => {
      const builds = [data.root.build].flat(1);
      builds.forEach(build => build.job = job);
      return builds;
    });
}

function getTestBuildMetadata (build) {
  const number = build.number._text;
  const job = build.job;
  const metadata = {
    id: `${job}/${number}`,
    job: job,
    jobURL: `${conf.jenkins.url}/job/${job}`,
    build: number,
    buildURL: `${conf.jenkins.url}/job/${job}/${number}`,
    status: build.building._text? 'running' : build.result._text.toLowerCase(),
    timestamp: build.timestamp._text,
    duration: build.duration._text,
  };
  let testResults = build.action.filter((item) => {
    if ( item._attributes === undefined ) return false;
    return item._attributes._class === "hudson.tasks.junit.TestResultAction"
  });
  if ( testResults.length ) {
    testResults = testResults[0];
    metadata.testResults = {
      fail: testResults.failCount._text,
      skip: testResults.skipCount._text,
      total: testResults.totalCount._text,
      pass: testResults.totalCount._text - testResults.failCount._text - testResults.skipCount._text
    };
    metadata.testResultsURL = `${metadata.buildURL}/${testResults.urlName._text}`;
  };
  return metadata;
}

export {
  fetchPipelineRunData,
  fetchProductBuilds,
  fetchVersionLists,
  getProductSettings,
}
