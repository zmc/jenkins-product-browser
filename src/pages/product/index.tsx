import { useParams } from "react-router-dom";
import Typography from "@material-ui/core/Typography";

import VersionList from "../../components/version_list";
import type { URLParams } from "../../App.d";

export default function Product() {
  const { product } = useParams() as URLParams;
  return (
    <>
      <Typography variant="h4">
        {product}: Development Version Status
      </Typography>
      <VersionList />
    </>
  );
}
