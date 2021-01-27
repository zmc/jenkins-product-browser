const conf = {
  jenkins: {
    url: "https://storage-jenkins-csb-ceph.cloud.paas.psi.redhat.com",
    api_url: process.env.REACT_APP_API_URL ||
      "http://localhost:3001",
    max_builds: 0,  // 0 or undefined -> unlimited
  },
  products: {
    ocs: {
      max_dev_builds: 1,
      age_limit: 180,
      jobs: {
        'ocs-ci': {
          version_param: "OCS_REGISTRY_IMAGE",
        },
        'ocs-ci-kvm': {
          version_param: "OCS_REGISTRY_IMAGE",
        }
      }
    }
  }
};
export default conf;
