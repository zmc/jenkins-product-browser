import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

function Image(props) {
  const getImageUrl = (image) => {
    const imageParts = image.split("/");
    if (imageParts[0] === "quay.io") {
      var url = `https://${imageParts[0]}/repository/${imageParts[1]}`;
      if (imageParts[2].includes("@")) {
        const [name, hash] = imageParts[2].split("@");
        url += `/${name}/manifest/${hash}`;
      } else if (imageParts[2].includes(":")) {
        const name = imageParts[2].split(":")[0];
        url += `/${name}`;
      }
      return url;
    }
  };
  const url = getImageUrl(props.data);
  return (
    <Typography>
      image:{" "}
      {url === undefined ? (
        props.data
      ) : (
        <Link href={url} target="_blank">
          {props.data}
        </Link>
      )}
    </Typography>
  );
}

export default Image;
