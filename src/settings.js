const conf = {
  jenkins: {
    url: "https://storage-jenkins-csb-ceph.cloud.paas.psi.redhat.com",
    api_url: process.env.REACT_APP_API_URL ||
      "https://reverse-proxy-jenkins-product-browser.apps.ocp4.prod.psi.redhat.com",
    max_builds: 0,  // 0 or undefined -> unlimited
  },
  ocs_metadata: {
    api_url: "https://ocs-metadata.int.open.paas.redhat.com/",
  },
  products: {
    OCS: {
      max_dev_builds: 1,
      age_limit: 180,  // TODO this is currently ignored
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
