import axios from "axios";
import coerce from "semver/functions/coerce";
import { useQuery, useQueries } from "react-query";
import convert from "xml-js";

import conf from "../settings.json";
import type { Conf, ProductConf } from "../settings.d";
import type {
  BuildXmlObj,
  VersionListsResult,
  VersionObj,
  BuildMetadata,
  XmlActionItem,
  XmlNamedItem,
  XmlTestResults,
  XmlParameter,
  PipelineRunData,
  QueryFnParams,
} from "./jenkins.d";

function getUrl(url: string) {
  if (process.env.NODE_ENV === "production") {
    return `${conf.jenkins.api_url}${url}`;
  }
  return url;
}

function getProductSettings(product: string): ProductConf {
  const matches = Object.keys(conf.products).filter((key) => {
    return key.toLowerCase() === product.toLowerCase();
  });
  const pName = matches[0];
  if (matches.length) return (conf as Conf).products[pName];
  throw new Error(`Product "${product}" not found!`);
}

async function fetchXML(url: string) {
  return axios
    .get(url)
    .then((resp) => {
      return resp.data;
    })
    .then((xml) => {
      return convert.xml2json(xml, { compact: true, nativeType: true });
    })
    .then((json) => {
      return JSON.parse(json);
    });
}

function useVersionLists({
  product = "",
  versionFilter = "",
}): VersionListsResult {
  const productSettings = getProductSettings(product);
  const jobs = Object.keys(productSettings.jobs);
  const versionQueries = useQueries(
    jobs.map((job) => {
      const jobSettings = productSettings.jobs[job];
      return {
        queryKey: ["versions", product, job, versionFilter],
        queryFn: () => fetchVersionList(job, jobSettings.version_param),
      };
    })
  );
  const result = {
    error: versionQueries.some((item) => item.error),
    isLoading: versionQueries.some((item) => item.isLoading),
    data: transformVersionList(
      product,
      Array.from(
        new Set(
          versionQueries
            .filter((item) => item.isSuccess)
            .map((item) => item.data)
            .flat()
        )
      ) as string[],
      versionFilter
    ),
  };
  return result;
}

async function fetchVersionList(job: string, version_param: string) {
  const url = getUrl(
    `/job/${job}/api/xml?tree=builds[number,actions[parameters[name,value]]]&wrapper=root&xpath=//*/build/action/parameter[name[text()='${version_param}']]/value`
  );
  return fetchXML(url).then((data) => {
    return data.root.value.map((item: any) => item._text);
  });
}

function transformVersionList(
  product: string,
  versionList: string[],
  versionFilter: string | undefined
): string[] {
  if (versionFilter !== undefined) {
    versionList = versionList.filter((item) => {
      return item.split(":")[1].startsWith(versionFilter);
    });
  }
  const versionObj = versionList.reduce((accumulator, currentValue) => {
    const semVer = coerce(currentValue);
    if (semVer) {
      const semVersion = semVer.version;
      if (accumulator[semVersion] === undefined) {
        accumulator[semVersion] = [];
      }
      accumulator[semVersion].push(currentValue);
    }
    return accumulator;
  }, {} as VersionObj);
  const settings = getProductSettings(product);
  let maxDevBuilds: number;
  if (versionFilter === undefined) maxDevBuilds = -1;
  else maxDevBuilds = settings.max_dev_builds || 0;
  Object.entries(versionObj).forEach(([semVer, subList]) => {
    if (maxDevBuilds > 0) {
      versionObj[semVer] = subList.slice(0, maxDevBuilds);
    }
  });
  return Object.values(versionObj).flat().sort().reverse();
}

function useProductBuilds({ product = "", version = "" }) {
  const { data, error, isLoading } = useQuery(
    ["builds", product, version],
    () => fetchProductBuilds({ product, version })
  );

  return { data, error, isLoading };
}

async function fetchProductBuilds({ product = "", version = "" }) {
  const productSettings = getProductSettings(product);
  const jobs = Object.keys(productSettings.jobs);
  return Promise.all(
    jobs.map(async (job) => {
      const version_param = productSettings.jobs[job].version_param;
      return fetchBuilds(job, version_param, version);
    })
  )
    .then((values) => {
      const lists = values.filter((item) => item !== undefined);
      return Array.from(new Set(lists.flat()));
    })
    .then((builds) => {
      return builds.map((build) => {
        const newBuild = getTestBuildMetadata(build);
        newBuild.product = product;
        const version_param = productSettings.jobs[build.job].version_param;
        newBuild.version = newBuild.parameters[version_param];
        return newBuild;
      });
    });
}

async function fetchBuilds(
  job: string,
  version_param: string,
  version: string
) {
  let url = getUrl(
    `/job/${job}/api/xml?tree=name,builds[number,actions[parameters[name,value],failCount,skipCount,totalCount,urlName],building,duration,result,timestamp]&wrapper=root&xpath=//*/build`
  );
  if (version && version_param) {
    url += `[action/parameter[name[text()='${version_param}']%20and%20value[text()='${version}']]]`;
  }
  return fetchXML(url).then((data) => {
    if (data.root.build === undefined) return [];
    const builds = [data.root.build].flat(1);
    builds.forEach((build) => (build.job = job));
    return builds;
  });
}

function getTestBuildMetadata(build: BuildXmlObj): BuildMetadata {
  const number = build.number._text;
  const job = build.job;
  const metadata: BuildMetadata = {
    id: `${job}/${number}`,
    job: job,
    jobURL: `${conf.jenkins.url}/job/${job}`,
    build: number,
    buildURL: `${conf.jenkins.url}/job/${job}/${number}`,
    status: build.building._text ? "running" : build.result._text.toLowerCase(),
    timestamp: build.timestamp._text,
    duration: build.duration._text,
    parameters: getBuildParams(build),
  };
  let filteredActions: XmlActionItem[] = build.action.filter((item) => {
    if (item._attributes === undefined) return false;
    return item._attributes._class === "hudson.tasks.junit.TestResultAction";
  });
  if (filteredActions.length) {
    const testResults = filteredActions[0] as XmlTestResults;
    metadata.testResults = {
      fail: testResults.failCount._text,
      skip: testResults.skipCount._text,
      total: testResults.totalCount._text,
      pass:
        testResults.totalCount._text -
        testResults.failCount._text -
        testResults.skipCount._text,
    };
    metadata.testResultsURL = `${metadata.buildURL}/${testResults.urlName._text}`;
  }
  return metadata;
}

function usePipelineRunData(
  job: string,
  build: number,
  status: string,
  version: string
): PipelineRunData {
  const pipelineUrl = getUrl(`/job/${job}/${build}/wfapi/`);
  const queryFn = async (params: QueryFnParams) => {
    return axios.get(params.queryKey[1].url).then((resp) => resp.data);
  };
  const fetchPipeline = status === undefined ? false : true;
  const {
    data: pipelineData,
    error: pipelineError,
    isLoading: isPipelineLoading,
  } = useQuery({
    queryKey: ["pipeline", { version, url: pipelineUrl }],
    queryFn,
    enabled: fetchPipeline,
    refetchOnWindowFocus: status === "in_progress",
  });
  let stage;
  let stageUrl;
  let fetchStage = false;
  const result: PipelineRunData = {
    data: { name: "", consoleUrl: "" },
    error: false,
    isLoading: true,
  };
  if (fetchPipeline && !isPipelineLoading) {
    stage = pipelineData.stages.filter(
      (_stage: any) => _stage.status.toLowerCase() === status // FIXME: any
    )[0];
    if (stage !== undefined) {
      stageUrl = getUrl(stage._links.self.href);
      fetchStage = true;
      result.data.name = stage.name;
    }
  }
  const {
    data: stageData,
    error: stageError,
    isLoading: isStageLoading,
  } = useQuery({
    queryKey: ["stage", { version, url: stageUrl }],
    queryFn,
    enabled: fetchStage,
    refetchOnWindowFocus: status === "in_progress",
  });
  if (fetchStage && !isStageLoading) {
    const node = stageData.stageFlowNodes.filter(
      (node: any) => node.status.toLowerCase() === status // FIXME: any
    )[0];
    result.data.consoleUrl = conf.jenkins.url + "/" + node?._links.console.href;
  }
  result.error = (pipelineError || stageError) as boolean;
  result.isLoading = isPipelineLoading || isStageLoading;
  return result;
}

function getBuildParams(build: BuildXmlObj) {
  const paramsAction = build.action.filter(
    (item) => item._attributes?._class === "hudson.model.ParametersAction"
  )[0] as XmlParameter;
  // If a build fails quickly enough (e.g. if the repo containing the
  // Jenkinsfile can't be cloned) we may not have a ParametersAction
  if (paramsAction === undefined) return {};
  const result = Object.fromEntries(
    paramsAction?.parameter.map((item: XmlNamedItem<string>) => [
      item.name._text,
      item.value._text,
    ])
  );
  return result;
}

export {
  useVersionLists,
  useProductBuilds,
  usePipelineRunData,
  getBuildParams,
  getProductSettings,
};
