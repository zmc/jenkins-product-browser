import Link from '@material-ui/core/Link';

function GridLink ({url, children}) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  )
}

export default GridLink;
