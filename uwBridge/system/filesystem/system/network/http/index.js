module.exports = async (app) => {
  const express = require('express');
  const vhost = require('vhost');
  const path = require('path');
  const fs = require('fs');
  const watch = require('node-watch');
  const compression = require('compression');
  const contentLength = require('express-content-length-validator');
  const toobusy = require('express-toobusy');
  const rateLimit = require('express-rate-limit');
  const {
    service: {
      http,
    },
    system: {
      network,
    },
    config,
    utility: {
      shallowRequire,
      each,
      mapObject,
      eachAsync
    }
  } = app;
  let indexFileCached;
  const indexLocation = config.http.indexLocation;
  const indexPage = function(req, res) {
    if (indexFileCached) {
      res.send(indexFileCached);
    } else {
      res.sendFile(indexLocation);
    }
  };
  const serverApp = network.app = express();
  // Server configuration methods used to apply settings to express
  const configureServerMethods = {};
  const buildRoutes = () => {
    mapObject(config.http.routes.get, (item) => {
      const callback = item.callback || indexPage;
      serverApp.get(item.route, callback);
    });
  };
  const setupHTTP = () => {
    /*
      DDOS + Flooding + Overall CPU lag
      for various types of protection.
      */
    /*
      CPU lag time
      */
    if (config.http.maxLagTime) {
      serverApp.use(toobusy(config.http.maxLagTime));
    }
    /*
      Rate Limit Function
      */
    if (config.http.rateLimt) {
      serverApp.use(rateLimit(config.http.rateLimt));
    }
    /*
      Security Plugins must be of higher order
      if issues arise kill request before processing.
      */
    mapObject(config.http.plugins, (item, key) => {
      if (item) {
        const funct = configureServerMethods[key];
        if (funct) {
          serverApp.use(funct);
        }
      }
    });
    /*
      Max size accepted for the content-length
      */
    if (config.http.maxContentLength) {
      serverApp.use(contentLength.validateMax({
        max: config.http.maxContentLength,
        message: 'Service is Busy',
        status: 200,
      }));
    }
    /*
      Compression functions
      Minify JS
      Gzip
      {
      threshold: 0
      }
      */
    serverApp.use(compression({
      threshold: 0
    }));
    // remove headers security fix
    serverApp.disable('x-powered-by');
    // Setup Routing
    buildRoutes();
    // set static folder
    serverApp.use(express.static(path.join(config.siteDir, 'public'), {
      dotfiles: 'allow'
    }));
    if (config.http.port === 443) {
      each(config.http.vHost, (item) => {
        http.appSecure.use(vhost(item, serverApp));
      });
    } else {
      each(config.http.vHost, (item) => {
        http.app.use(vhost(item, serverApp));
      });
    }
  };
  const updateIndexCache = () => {
    fs.readFile(indexLocation, {
      encoding: 'utf8'
    }, (err, data) => {
      if (err) {
        return console.log(err);
      }
      indexFileCached = data;
    });
  };
  if (indexLocation) {
    updateIndexCache();
    watch(indexLocation.replace('index.html', ''), (evt, filename) => {
      if (evt === 'update' && filename === indexLocation) {
        updateIndexCache();
      }
    });
  }
  const items = await shallowRequire(`${__dirname}/plugin`);
  await eachAsync(items, async (item) => {
    await item.module(app, configureServerMethods);
  });
  setupHTTP();
};
