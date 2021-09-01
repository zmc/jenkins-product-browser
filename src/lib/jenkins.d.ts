export interface BuildXmlObj {
  job: string;
  number: XmlItem<number>;
  result: XmlItem<string>;
  building: XmlItem<boolean>;
  timestamp: XmlItem<number>;
  duration: XmlItem<number>;
  action: (XmlActionItem | XmlParameter | XmlTestResults)[];
}

export interface XmlItem<Type> {
  _text: Type;
  _attributes: {
    _class: string;
  };
}

export interface XmlActionItem {
  _attributes?: {
    _class: string;
  };
}

export interface XmlNamedItem<Type> {
  name: XmlItem<string>;
  value: XmlItem<Type>;
}

export interface XmlParameter extends XmlActionItem {
  parameter: XmlNamedItem<string>[];
}

export interface XmlTestResults extends XmlActionItem {
  failCount: XmlItem<number>;
  passCount: XmlItem<number>;
  skipCount: XmlItem<number>;
  totalCount: XmlItem<number>;
  urlName: XmlItem<string>;
}

export interface BuildMetadata {
  product?: string;
  version?: string;
  id: string;
  job: string;
  jobURL: string;
  build: number;
  buildURL: string;
  status: string;
  timestamp: number;
  duration: number;
  parameters: any;
  testResults?: any;
  testResultsURL?: string;
}

export interface PipelineRunData {
  data: {
    name: string;
    consoleUrl: string;
  };
  error: boolean;
  isLoading: boolean;
}

export interface PipelineStageData {
  durationMillis: number;
  execNode: string;
  id: number;
  name: string;
  pauseDurationMillis: number;
  startTimeMillis: number;
  status: string;
}

export interface PipelineStageFlowNode {
  status: string;
  links: { [k: string]: string };
}

export interface QueryFnParams {
  queryKey: any;
}

export interface VersionListsResult {
  error: boolean;
  isLoading: boolean;
  data: string[];
}

export interface VersionObj {
  [key: string]: string[];
}
