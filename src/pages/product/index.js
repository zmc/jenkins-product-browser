import { useParams } from "react-router-dom";
import Typography from "@material-ui/core/Typography";

import VersionList from "../../components/version_list";

export default function Product() {
  const { product, version } = useParams();
  return (
    <>
      <Typography variant="h4">
        {product}: Development Version Status
      </Typography>
      <VersionList version={version} />
    </>
  );
}
