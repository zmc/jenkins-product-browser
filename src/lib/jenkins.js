import coerce from 'semver/functions/coerce';
import { useQuery, useQueries } from 'react-query';
import convert from 'xml-js';

import conf from '../settings.js';


function getUrl (url) {
  if ( process.env.NODE_ENV === 'production' ) {
    return `${conf.jenkins.api_url}${url}`;
  }
  return url;
}

function getProductSettings (product) {
  const matches = Object.keys(conf.products).filter(key => {
    return key.toLowerCase() === product.toLowerCase();
  });
  if ( matches.length ) return conf.products[matches[0]];
};

async function fetchXML (url) {
  return fetch(url, {cache: "default"})
    .then(resp => {
      if ( resp.ok ) return resp.text();
    }).then(xml => {
        return convert.xml2json(xml, {compact: true, nativeType: true});
    }).then(json => {
      return JSON.parse(json);
    });
}

function useVersionLists({product, versionFilter}) {
  const productSettings = getProductSettings(product);
  const jobs = Object.keys(productSettings.jobs);
  const versionQueries = useQueries(
    jobs.map(job => {
      const jobSettings = productSettings.jobs[job];
      return {
        queryKey: ['versions', product, job, versionFilter],
        queryFn: () => fetchVersionList(job, jobSettings.version_param),
      }
    })
  );
  const result = {
    error: versionQueries.some(item => item.error),
    isLoading: versionQueries.some(item => item.isLoading),
    data: transformVersionList({
      product,
      versionList: Array.from(new Set(
        versionQueries.filter(item => item.isSuccess)
          .map(item => item.data).flat()
      )),
      versionFilter,
    }),
  };
  return result;
}

async function fetchVersionList (job, version_param) {
  const url = getUrl(`/job/${job}/api/xml?tree=builds[number,actions[parameters[name,value]]]&wrapper=root&xpath=//*/build/action/parameter[name[text()='${version_param}']]/value`);
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
  const settings = getProductSettings(product);
  const maxDevBuilds = versionFilter === undefined? (settings.max_dev_builds || 0): -1;
  Object.entries(versionObj).forEach(([semVer, subList]) => {
    subList.sort().reverse();
    if ( maxDevBuilds > 0 ) {
      versionObj[semVer] = subList.slice(0, maxDevBuilds);
    }
  });
  return Object.values(versionObj).flat().sort().reverse();
}

function useProductBuilds({product, version}) {
  const { data, error, isLoading } = useQuery(
    ['builds', product, version],
    () => fetchProductBuilds({product, version}),
  )

  return {data, error, isLoading};
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
    return builds.map(build => {
      const newBuild = getTestBuildMetadata(build);
      newBuild.product = product;
      const version_param = productSettings.jobs[build.job].version_param;
      newBuild.version = newBuild.parameters[version_param];
      return newBuild;
    });
  })
};

async function fetchBuilds ({job, version_param, version}) {
  let url = getUrl(`/job/${job}/api/xml?tree=name,builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,duration,result,timestamp]&wrapper=root&xpath=//*/build`);
  if ( version && version_param ) {
    url += `[action/parameter[name[text()='${version_param}']%20and%20value[text()='${version}']]]`;
  }
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
    parameters: getBuildParams(build),
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

function usePipelineRunData({job, build, status, version}) {
  const pipelineUrl = getUrl(`/job/${job}/${build}/wfapi/`);
  const queryFn = async ({ queryKey }) => {
    return fetch(queryKey[1].url).then(resp => resp.json());
  };
  const fetchPipeline = status === undefined ? false : true;
  const { data: pipelineData, error: pipelineError, isLoading: isPipelineLoading } = useQuery({
    queryKey: ['pipeline', {version, url: pipelineUrl}],
    queryFn,
    enabled: fetchPipeline,
    refetchOnWindowFocus: status === 'in_progress',
  })
  let stage;
  let stageUrl;
  let fetchStage = false;
  const result = {data: {}};
  if ( fetchPipeline && ! isPipelineLoading ) {
    stage = pipelineData.stages.filter(
      _stage => _stage.status.toLowerCase() === status)[0];
    if ( stage !== undefined ) {
      stageUrl = getUrl(stage._links.self.href);
      fetchStage = true;
      result.data.name = stage.name;
    }
  }
  const { data: stageData, error: stageError, isLoading: isStageLoading } = useQuery({
    queryKey: ['stage', {version, url: stageUrl}],
    queryFn,
    enabled: fetchStage,
    refetchOnWindowFocus: status === 'in_progress',
  })
  if ( fetchStage && ! isStageLoading ) {
    const node = stageData.stageFlowNodes.filter(
      node => node.status.toLowerCase() === status)[0];
    result.data.consoleUrl = conf.jenkins.url + '/' +
      node?._links.console.href;
  }
  result.error = pipelineError || stageError;
  result.isLoading = isPipelineLoading || isStageLoading;
  return result;
}

function getBuildParams (build) {
  const paramsAction = build.action.filter(item => item._attributes?._class === "hudson.model.ParametersAction")[0];
  const result = Object.fromEntries(
    paramsAction.parameter.map(item => [item.name._text, item.value._text])
  );
  return result;
}

export {
  useVersionLists,
  useProductBuilds,
  usePipelineRunData,
  getBuildParams,
}
