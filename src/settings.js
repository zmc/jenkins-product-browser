const conf = {
  jenkins: {
    url: "https://storage-jenkins-csb-ceph.cloud.paas.psi.redhat.com",
    api_url: "http://localhost:3000"
  },
  products: {
    ocs: {
      max_dev_builds: 1,
      age_limit: 30,
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
