"use strict";

const Module = require("module");
const Fs = require("fs");
const Yaml = require("yamljs");
const Path = require("path");
const Promise = require("bluebird");
const Fyn = require("../lib/fyn");
const _ = require("lodash");
const PkgInstaller = require("../lib/pkg-installer");
const DepData = require("../lib/dep-data");
const semver = require("semver");
const chalk = require("chalk");
const logger = require("../lib/logger");
const CliLogger = require("../lib/cli-logger");
const PromiseQueue = require("../lib/util/promise-queue");
const sortObjKeys = require("../lib/util/sort-obj-keys");
const fyntil = require("../lib/util/fyntil");
const showStat = require("./show-stat");
const showSetupInfo = require("./show-setup-info");
const logFormat = require("../lib/util/log-format");

const { FETCH_META, FETCH_PACKAGE, LOAD_PACKAGE, INSTALL_PACKAGE } = require("../lib/log-items");

const checkFlatModule = () => {
  const symbols = Object.getOwnPropertySymbols(Module)
    .map(x => x.toString())
    .filter(x => x.indexOf("node-flat-module") >= 0);

  return symbols.length > 0;
};

const warnFlatModule = pkgs => {
  if (!checkFlatModule()) {
    pkgs.forEach(depInfo => {
      const pkgId = logFormat.pkgId(depInfo);
      logger.warn(`locally linked module ${pkgId} require flat-module for nested dependencies`);
    });
    logger.fyi(
      "local package linking requires",
      chalk.green("node-flat-module"),
      "loaded before startup"
    );
    if (!semver.gte(process.versions.node, "8.0.0")) {
      logger.fyi(
        "Your node version",
        chalk.magenta(process.versions.node),
        "doesn't support",
        chalk.green("NODE_OPTIONS")
      );
      logger.fyi("You have to use the", chalk.magenta("-r"), "option explicitly");
    } else {
      showSetupInfo();
    }

    logger.fyi(
      `See ${chalk.blue("https://github.com/electrode-io/fyn#setup-flat-module")} for more details.`
    );
  }
};

const myPkg = require("./mypkg");
const myDir = Path.join(__dirname, "..");

class FynCli {
  constructor(options) {
    this._rc = options;
    if (options.noStartupInfo !== true) this.showStartupInfo();
    this._fyn = undefined;
  }

  get fyn() {
    if (!this._fyn) this._fyn = new Fyn(this._rc);
    return this._fyn;
  }

  showStartupInfo() {
    logger.verbose(chalk.green("fyn"), "version", myPkg.version, "at", chalk.magenta(myDir));
    logger.verbose(
      chalk.green("NodeJS"),
      "version",
      process.version,
      "at",
      chalk.magenta(process.execPath)
    );
    logger.verbose("env NODE_OPTIONS is", chalk.magenta(process.env.NODE_OPTIONS));
    logger.verbose("working dir is", chalk.magenta(this._rc.cwd));
    logger.verbose("Max network concurrency is", this._rc.concurrency);
  }

  saveLogs(dbgLog) {
    Fs.writeFileSync(dbgLog, logger.logData.join("\n") + "\n");
  }

  fail(msg, err) {
    const dbgLog = "fyn-debug.log";
    logger.freezeItems(true);
    logger.error(msg, `CWD ${this.fyn.cwd}`);
    logger.error(msg, "Please check for any errors that occur above.");
    const lessCmd = chalk.magenta(`less -R ${dbgLog}`);
    logger.error(
      msg,
      `Also check ${chalk.magenta(dbgLog)} for more details. ${lessCmd} if you are on Un*x.`
    );
    logger.error(msg, err.message);
    logger.debug("STACK:", err.stack);
    this.saveLogs(dbgLog);
    fyntil.exit(err);
  }

  add(argv) {
    const addSec = (section, packages) => {
      if (_.isEmpty(packages)) return [];

      const items = packages.map(x => {
        const semverPath = this.fyn.pkgSrcMgr.getSemverAsFilepath(x);
        if (semverPath) {
          return {
            $: x,
            name: "",
            semver: x,
            semverPath,
            section,
            parent: {}
          };
        }
        const atX = x.lastIndexOf("@");
        return {
          $: x,
          name: atX > 0 ? x.substr(0, atX) : x,
          semver: atX > 0 ? x.substr(atX + 1) : "latest",
          section,
          parent: {}
        };
      });

      if (!_.isEmpty(items)) {
        logger.info(`Adding packages to ${section}:`, packages.join(", "));
      }

      return items;
    };

    const sections = {
      dependencies: "packages",
      devDependencies: "dev",
      optionalDependencies: "optional",
      peerDependencies: "peer"
    };

    let items = [];
    _.each(sections, (argKey, section) => {
      items = items.concat(addSec(section, argv[argKey]));
    });

    if (_.isEmpty(items)) {
      logger.error("No packages to add");
      exit(1);
    }

    const spinner = CliLogger.spinners[1];
    logger.addItem({ name: FETCH_META, color: "green", spinner });
    logger.updateItem(FETCH_META, "loading meta...");

    const results = [];

    return new PromiseQueue({
      concurrency: 10,
      stopOnError: true,
      processItem: item => {
        let found;
        return Promise.try(() => this._fyn._pkgSrcMgr.fetchLocalItem(item))
          .then(meta => meta || this.fyn.pkgSrcMgr.fetchMeta(item))
          .then(meta => {
            if (!meta) {
              logger.error("Unable to retrieve meta for package", item.name);
              return;
            }
            // logger.info("adding", x.name, x.semver, meta);
            // look at dist tags
            const tags = meta["dist-tags"];
            if (meta.local) {
              logger.info("adding local package at", item.fullPath);
              item.name = meta.name;
              found = Path.relative(this.fyn.cwd, item.fullPath).replace(/\\/g, "/");
            } else if (tags && tags[item.semver]) {
              logger.debug("adding with dist tag for", item.name, item.semver, tags[item.semver]);
              found = `^${tags[item.semver]}`;
              if (!semver.validRange(found)) found = tags[item.semver];
            } else {
              // search
              const versions = Object.keys(meta.versions).filter(v =>
                semver.satisfies(v, item.semver)
              );
              if (versions.length > 0) {
                found = item.semver;
              } else {
                logger.error(chalk.red(`no matching version found for ${item.$}`));
              }
            }
            if (found) {
              logger.info(`found ${found} for ${item.$}`);
              item.found = found;
              results.push(item);
            }
          });
      },
      watchTime: 5000,
      itemQ: items
    })
      .resume()
      .wait()
      .then(() => {
        logger.removeItem(FETCH_META);

        if (results.length === 0) {
          logger.info("No packages found for add");
          return false;
        }

        const added = _.mapValues(sections, () => []);

        const pkg = this.fyn._pkg;
        results.forEach(item => {
          _.set(pkg, [item.section, item.name], item.found);
          added[item.section].push(item.name);
        });

        Object.keys(sections).forEach(sec => {
          if (added[sec].length > 0 && pkg[sec]) {
            pkg[sec] = sortObjKeys(pkg[sec]);
            logger.info(`Packages added to ${sec}:`, added[sec].join(", "));
          }
        });

        this.fyn.savePkg();
        return true;
      });
  }

  remove(argv) {
    if (_.isEmpty(argv.packages)) {
      logger.error("No packages to remove");
      exit(1);
    }

    const sections = [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies"
    ];

    const packages = argv.packages.slice();

    const removed = [];
    sections.forEach(sec => {
      const section = this.fyn._pkg[sec];
      if (_.isEmpty(section)) return;
      for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        if (section.hasOwnProperty(pkg)) {
          delete section[pkg];
          removed.push(pkg);
          packages[i] = undefined;
        }
      }
    });

    const remaining = packages.filter(x => x);
    if (!_.isEmpty(remaining)) {
      logger.error("These packages don't exist in your package.json:", remaining.join(", "));
    }

    if (removed.length > 0) {
      logger.info("removed packages from package.json:", removed.join(", "));
      this.fyn.savePkg();
      return true;
    }

    logger.error("No package was removed");

    return false;
  }

  install() {
    const spinner = CliLogger.spinners[1];
    const start = Date.now();
    logger.addItem({ name: FETCH_META, color: "green", spinner });
    logger.updateItem(FETCH_META, "resolving dependencies...");
    return this.fyn
      .resolveDependencies()
      .then(() => {
        logger.removeItem(FETCH_META);
        logger.addItem({ name: FETCH_PACKAGE, color: "green", spinner });
        logger.updateItem(FETCH_PACKAGE, "fetching packages...");
        logger.addItem({ name: LOAD_PACKAGE, color: "green", spinner });
        logger.updateItem(LOAD_PACKAGE, "loading packages...");
        return this.fyn.fetchPackages();
      })
      .then(() => {
        logger.removeItem(FETCH_PACKAGE);
        logger.removeItem(LOAD_PACKAGE);
        logger.addItem({ name: INSTALL_PACKAGE, color: "green", spinner });
        logger.updateItem(INSTALL_PACKAGE, "installing packages...");
        const installer = new PkgInstaller({ fyn: this.fyn });

        return installer.install();
      })
      .then(() => {
        logger.removeItem(INSTALL_PACKAGE);
        const end = Date.now();
        if (this.fyn.needFlatModule) {
          warnFlatModule(this.fyn.localPkgWithNestedDep);
        }
        logger.info(
          chalk.green("complete in total"),
          chalk.magenta(`${(end - start) / 1000}`) + "secs"
        );
        if (this._rc.saveLogs) {
          this.saveLogs(this._rc.saveLogs);
        }
      })
      .catch(err => {
        this.fail(chalk.red("install failed:"), err);
      });
  }

  stat(argv) {
    return showStat(this.fyn, argv.args.packages, argv.opts.follow);
  }
}

module.exports = FynCli;
