import { useParams } from "react-router-dom";
import { useIsFetching } from "react-query";

import format from "date-fns/format";
import formatDistanceToNowStrict from "date-fns/formatDistanceToNowStrict";
import intervalToDuration from "date-fns/intervalToDuration";
import formatDuration from "date-fns/formatDuration";

import Skeleton from "@material-ui/lab/Skeleton";
import { DataGrid, GridColDef, GridValueFormatterParams } from "@material-ui/data-grid";

import type { URLParams } from "../../App.d";
import { useProductBuilds } from "../../lib/jenkins";
import FetchError from "../fetch_error";
import GridLink from "../grid_link";
import Stage from "../stage";
import TestResults from "../test_results";
import styles from "./style.module.css";

const columns: GridColDef[] = [
  {
    field: "timestamp",
    type: "dateTime",
    headerName: "Started",
    valueFormatter: ({ value }) => format(new Date(value as number), "yyyy-MM-dd HH:mm"),
    valueGetter: (params) => new Date(params.row.timestamp),
    width: 150,
  },
  {
    field: "duration",
    headerName: "Duration",
    valueFormatter: (params: GridValueFormatterParams) => {
      if (!params.value) {
        return formatDistanceToNowStrict(new Date(params.row.timestamp));
      } else {
        return (
          formatDuration(intervalToDuration({ start: 0, end: params.value as number }), {
            format: ["hours", "minutes"],
          }) || `${Math.round(params.value as number / 1000)} seconds`
        );
      }
    },
    width: 175,
  },
  {
    field: "status",
    headerName: "Status",
    width: 125,
    valueFormatter: ({ value }) => (value ? value : "?"),
    cellClassName: (params) =>
      styles[params.value ? (params.value as string).toLowerCase() : "unknown"],
  },
  {
    field: "job",
    headerName: "Job",
    width: 125,
    renderCell: (params) => (
      <GridLink url={params.row.jobURL}>
        {params.row.job}
      </GridLink>
    ),
  },
  {
    field: "build",
    headerName: "Build",
    width: 125,
    renderCell: (params) => (
      <GridLink url={params.row.buildURL}>
        {params.row.build}
      </GridLink>
    ),
  },
  {
    field: "stage",
    headerName: "Stage",
    width: 150,
    renderCell: (params) => (
      <Stage
        version={params.row.version}
        job={params.row.job}
        build={params.row.build}
        status={params.row.status}
      />
    ),
  },
  {
    field: "testResults",
    headerName: "Tests",
    width: 175,
    renderCell: (params) => (
      <TestResults
        results={params.row.testResults}
        url={params.row.testResultsURL}
      />
    ),
  },
];

type VersionDataGridProps = {
  value?: string;
  pageSize?: number;
  versionColumn: boolean
}

export default function VersionDataGrid(props: VersionDataGridProps) {
  const { product } = useParams() as URLParams;
  const { data, error, isLoading } = useProductBuilds({
    product,
    version: props.value,
  });
  const isFetching = useIsFetching(["builds", product, props.value]);
  const pageSize = props.pageSize || 5;
  let inner;
  // Ideally minHeight would be 80, but anything under 140 seems to invoke:
  // Warning: `Infinity` is an invalid value for the `minHeight` css style
  // property.
  const minHeight = 140;
  let height: number | string = "auto";
  let pagination = false;
  if (error) {
    inner = <FetchError />;
  } else if (isLoading) {
    inner = <Skeleton variant="rect" height={minHeight} animation="wave" />;
  } else {
    const dataLength = data?.length || 0;
    pagination = dataLength > pageSize;
    height = Math.max(minHeight, 50 + 36 * Math.min(dataLength, pageSize));
    if (pagination) height += 52;
    const columns_ = [...columns];
    if (props.versionColumn === true) {
      const splitVersion = (ver: string) => (ver ? ver.split(":")[1] : null);
      columns_.unshift({
        field: "version",
        headerName: "Version",
        width: 125,
        valueFormatter: (params: GridValueFormatterParams) => splitVersion(params.value as string),
        valueParser: (value: string) => splitVersion(value),
      } as GridColDef);
    }
    inner = (
      <DataGrid
        loading={Boolean(isLoading || isFetching)}
        rows={data || []}
        columns={columns_}
        density="compact"
        pageSize={pageSize}
        hideFooter={!pagination}
        sortModel={[
          {
            field: "timestamp",
            sort: "desc",
          },
        ]}
      />
    );
  }
  return (
    <div style={{ height: height, width: "100%" }}>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flexGrow: 1 }}>{inner}</div>
      </div>
    </div>
  );
}
