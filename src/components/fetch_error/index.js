import { useQueryClient } from 'react-query';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';


export default function FetchError () {
  const queryClient = useQueryClient();
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
      >
        Retry
      </Button>
      </div>
    </div>
  )
};
