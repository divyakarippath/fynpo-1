"use strict";

/* eslint-disable no-magic-numbers */

const _ = require("lodash");
const logger = require("./logger");
const assert = require("assert");
const PkgDistExtractor = require("./pkg-dist-extractor");
const PromiseQueue = require("./util/promise-queue");
const chalk = require("chalk");
const longPending = require("./long-pending");
const logFormat = require("./util/log-format");
const { FETCH_PACKAGE } = require("./log-items");

const WATCH_TIME = 2000;

class PkgDistFetcher {
  constructor(options) {
    assert(options && options.data, "Must provide options and options.data");
    this._data = options.data;
    this._packages = {};
    this._pkgSrcMgr = options.pkgSrcMgr;
    this._grouping = {
      need: [],
      optional: [],
      byOptionalParent: []
    };
    this._distExtractor = new PkgDistExtractor({ fyn: options.fyn });
    this._fyn = options.fyn;
    this._promiseQ = new PromiseQueue({
      concurrency: this._fyn.concurrency,
      stopOnError: true,
      watchTime: WATCH_TIME,
      processItem: x => this.fetchItem(x)
    });
    this._promiseQ.on("watch", items => longPending.onWatch(items));
    this._promiseQ.on("done", x => this.done(x));
    this._promiseQ.on("doneItem", x => this.handleItemDone(x));
    this._promiseQ.on("failItem", _.noop);
  }

  async wait() {
    try {
      await this._promiseQ.wait();

      await this._distExtractor.wait();

      const time = logFormat.time(Date.now() - this._startTime);
      logger.info(`${chalk.green("done loading packages")} ${time}`);
    } catch (err) {
      // TODO: should interrupt and stop dist exractor
      throw err;
    }
  }

  start() {
    this._startTime = Date.now();
    _.each(this._data.getPkgsData(), (pkg, name) => {
      _.each(pkg, (vpkg, version) => {
        const id = logFormat.pkgId(name, version);
        this._packages[id] = vpkg;
        if (vpkg.dsrc === "opt") {
          // only needed optionally
          return this._grouping.optional.push(id);
        } else if (vpkg.src === "opt") {
          // only needed by a parent that's needed optionally
          return this._grouping.byOptionalParent.push(id);
        } else {
          const byOptionalParent = !vpkg.requests.find(r => !_.last(r).startsWith("opt;"));
          if (byOptionalParent) {
            return this._grouping.byOptionalParent.push(id);
          }
        }
        return this._grouping.need.push(id);
      });
    });
    const itemQ = this._grouping.need // first fetch all the needed deps (dep/dev)
      .concat(this._grouping.optional) // then the optional deps
      .concat(this._grouping.byOptionalParent); // then deps pulled by an opt dep
    this._promiseQ.setItemQ(itemQ);
  }

  done(data) {
    logger.removeItem(FETCH_PACKAGE);
    const time = logFormat.time(data.totalTime);
    logger.info(`${chalk.green("packages fetched")} (part of loading) ${time}`);
  }

  handleItemDone(data) {
    if (data.res && data.res.fullTgzFile) {
      this._distExtractor.addPkgDist({ pkg: data.res.pkg, fullTgzFile: data.res.fullTgzFile });
    }
  }

  async fetchItem(item) {
    const pkg = this._packages[item];

    if (pkg.local) return undefined;

    const json = await this._fyn.ensureProperPkgDir(pkg);

    // valid json read from pkg dir, assume previous installed node_modules, do nothing
    if (json) return {};

    // fetch package tarball
    try {
      const r = await this._pkgSrcMgr.fetchTarball(pkg);
      return r ? { fullTgzFile: r.fullTgzFile, pkg } : {};
    } catch (err) {
      const pkgName = logFormat.pkgId(pkg);
      logger.debug(`dist-fetcher fetch ${pkgName} tarball failed`, chalk.red(err.message));
      logger.debug("STACK", err.stack);
      throw err;
    }
  }
}

module.exports = PkgDistFetcher;
