import { useParams } from "react-router-dom";

import { useVersionLists } from "../../lib/jenkins";
import FetchError from "../fetch_error";
import Version from "../version";
import type { URLParams } from "../../App.d";

function VersionList() {
  const { product, version } = useParams() as URLParams;
  const { data, error, isLoading } = useVersionLists({
    product,
    versionFilter: version,
  });
  if (error) {
    return <FetchError />;
  }
  if (isLoading) {
    return null;
  }
  return (
    <>
      {data.map((item) => (
        <Version key={item} value={item} />
      ))}
    </>
  );
}

export default VersionList;
