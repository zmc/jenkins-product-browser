const conf = {
  jenkins: {
    url: "https://storage-jenkins-csb-ceph.cloud.paas.psi.redhat.com",
    api_url: "http://localhost:3000"
  },
  products: {
    ocs: {
      maxDevBuilds: 1,
      age_limit: 30,
      jobs: {
        'ocs-ci': {
          version_param: "OCS_REGISTRY_IMAGE",
          version_xform: (v) => { return v.split(':')[1] },
          version_exclude: ["latest"]
        },
        'ocs-ci-kvm': {
          version_param: "OCS_REGISTRY_IMAGE",
          version_xform: (v) => { return v.split(':')[1] },
          version_exclude: ["latest"]
        }
      }
    }
  }
};
export default conf;
