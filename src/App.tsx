import { MouseEventHandler } from "react";
import { Switch, Route, Link as RouterLink } from "react-router-dom";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import Link from "@material-ui/core/Link";
import GitHubIcon from "@material-ui/icons/GitHub";

import type { AppProps, CrumbsProps } from "./App.d";
import "./App.css";
import Home from "./pages/home";
import Product from "./pages/product";
import BuildList from "./pages/builds";

function Bar(props: AppProps) {
  return (
    <AppBar position="static">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "12px",
        }}
      >
        <div>
          <Route>
            {({ location }) => {
              return <Crumbs location={location} />;
            }}
          </Route>
        </div>
        <div style={{ textAlign: "end" }}>
          <IconButton onClick={props.toggleDarkMode as MouseEventHandler}>
            {props.darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Link
            href="https://github.com/zmc/jenkins-product-browser"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconButton>
              <GitHubIcon />
            </IconButton>
          </Link>
        </div>
      </div>
    </AppBar>
  );
}

function Crumbs(props: CrumbsProps) {
  const pathnames = props.location.pathname.split("/").filter((x) => x);
  return (
    <Breadcrumbs arial-label="breadcrumb">
      <Link color="inherit" to="/" component={RouterLink}>
        <Typography color="textPrimary">jenkins product browser</Typography>
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        return last ? (
          <Typography color="textPrimary" key={to}>
            {value}
          </Typography>
        ) : (
          <Link color="inherit" to={to} key={to} component={RouterLink}>
            {value}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

function App(props: AppProps) {
  return (
    <div className="App">
      <Bar {...props} />
      <div className="main">
        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          <Route path="/products" exact>
            <Home />
          </Route>
          <Route path="/products/:product/builds">
            <BuildList />
          </Route>
          <Route path="/products/:product/:version">
            <Product />
          </Route>
          <Route path="/products/:product">
            <Product />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default App;
