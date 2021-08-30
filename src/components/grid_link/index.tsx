import { ReactNode } from "react";
import Link from "@material-ui/core/Link";

type GridLinkProps = {
  url: string;
  children: ReactNode;
};

function GridLink(props: GridLinkProps) {
  return (
    <Link href={props.url} target="_blank" rel="noopener noreferrer">
      {props.children}
    </Link>
  );
}

export default GridLink;
