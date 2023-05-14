import "./set-public-path";
import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import App from "./App";
// import 'antd/dist/antd.less';
import config from '../config';
import './assets/svg.js';

const lifecycles = singleSpaReact({
    React,
    ReactDOM,
    rootComponent: App,
    errorBoundary(err, info, props) {
        // Customize the root error boundary for your microfrontend here.
        return null;
    },
});

function setDisplay(show) {
    const id = "single-spa-application:@mf/" + config.projectName;
    const el = document.getElementById(id);
    if (null === el) return;
    el.style.display = show ? "block" : "none";
}

export function mount(props) {
    setDisplay(true);
    return lifecycles.mount(props);
}

lifecycles.unmount = async () => {
    setDisplay(false);
};
export const { bootstrap, unmount } = lifecycles;