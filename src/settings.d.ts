interface Conf {
  jenkins: { url: string; api_url: string; max_builds: number };
  ocs_metadata: { api_url: string };
  products: { [key: string]: ProductConf };
}

interface ProductConf {
  max_dev_builds: number;
  jobs: { [key: string]: JobConf };
}

interface JobConf {
  version_param: string;
}

export type { Conf, ProductConf };
