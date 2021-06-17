import { useQueryClient, useIsFetching } from 'react-query';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import RefreshIcon from '@material-ui/icons/Refresh';
import CircularProgress from '@material-ui/core/CircularProgress';


export default function FetchError () {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const retryQueries = () => {
    queryClient.invalidateQueries({stale: true});
  }
  return (
    <div style={{display: "flex", justifyContent: "center", paddingTop: "40px"}}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
      <Typography>
        Failed to fetch data from Jenkins! Please try again later.
      </Typography>
      <Button
        onClick={retryQueries}
        variant="contained"
        color="primary"
        style={{width: "fit-content"}}
        disabled={isFetching > 0}
      >
        { isFetching? <CircularProgress style={{width: 24, height: 24}} /> : <RefreshIcon /> }
        &nbsp;Retry
      </Button>
      </div>
    </div>
  )
};
