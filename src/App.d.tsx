export type AppProps = {
  darkMode: boolean;
  toggleDarkMode: Function;
}

export type CrumbsProps = {
  location: {
    pathname: string;
  }
}

export type URLParams = {
  product: string;
  version: string;
}
