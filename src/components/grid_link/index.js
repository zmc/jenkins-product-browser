import Link from '@material-ui/core/Link';

function GridLink ({url, children}) {
  return (
    <Link href={url} target="_blank">
      {children}
    </Link>
  )
}

export default GridLink;
