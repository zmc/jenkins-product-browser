import { useParams } from "react-router-dom";
import Typography from "@material-ui/core/Typography";

import VersionDataGrid from "../../components/version_datagrid";

export default function BuildList() {
  const { product } = useParams();
  return (
    <>
      <Typography variant="h3">{product}: Latest Build Status</Typography>
      <VersionDataGrid pageSize={25} versionColumn={true} />
    </>
  );
}
