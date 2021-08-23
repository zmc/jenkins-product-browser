import { useState } from "react";
import { useQueryClient } from "react-query";
import { useParams } from "react-router-dom";

import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import FormatListBulleted from "@material-ui/icons/FormatListBulleted";
import Refresh from "@material-ui/icons/Refresh";

import BuildContents from "../build_contents";
import VersionDataGrid from "../version_datagrid";
import styles from "./style.module.css";

function Version(props) {
  const { product } = useParams();
  const [contentsOpen, setContentsOpen] = useState(false);
  const queryClient = useQueryClient();
  const short_version = props.value.split(":")[1];
  const refresh = () => {
    queryClient.invalidateQueries(["builds", product, props.value]);
    queryClient.invalidateQueries(["pipeline", { version: props.value }]);
    queryClient.invalidateQueries(["stage", { version: props.value }]);
  };
  return (
    <div className={styles.version}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5" component="span" style={{ padding: 5 }}>
          {short_version}
        </Typography>
        <div style={{ textAlign: "end" }}>
          <IconButton
            onClick={() => {
              setContentsOpen(true);
            }}
            style={{ marginTop: -5 }}
          >
            <FormatListBulleted />
          </IconButton>
          <IconButton onClick={refresh} style={{ marginTop: -5 }}>
            <Refresh />
          </IconButton>
        </div>
      </div>
      <BuildContents
        open={contentsOpen}
        setOpen={setContentsOpen}
        version={short_version}
      />
      <VersionDataGrid value={props.value} versionColumn={false} />
    </div>
  );
}

export default Version;
