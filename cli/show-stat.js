"use strict";

const chalk = require("chalk");
const CliLogger = require("../lib/cli-logger");
const logger = require("../lib/logger");
const _ = require("lodash");
const semverUtil = require("../lib/util/semver");
const Promise = require("bluebird");
const logFormat = require("../lib/util/log-format");
const PkgDepLinker = require("../lib/pkg-dep-linker");
const { FETCH_META } = require("../lib/log-items");

// returns array of packages match id
function findPkgsById(pkgs, id) {
  const ix = id.indexOf("@", 1);
  const sx = ix > 0 ? ix : id.length;
  const name = id.substr(0, sx);
  const semver = id.substr(sx + 1);

  return _(pkgs[name])
    .map((vpkg, version) => {
      if (!semver || semverUtil.satisfies(version, semver)) {
        return vpkg;
      }
    })
    .filter(x => x)
    .value();
}

async function findDependents(fyn, pkgs, ask) {
  const dependents = [];
  const depLinker = new PkgDepLinker({ fyn });
  for (const name in pkgs) {
    const pkg = pkgs[name];
    for (const version in pkg) {
      const vpkg = pkg[version];

      await depLinker.loadPkgDepData(vpkg);
      const res = _.get(vpkg, ["json", "_depResolutions", ask.name]);

      if (res && semverUtil.satisfies(res.resolved, ask.version)) {
        dependents.push(vpkg);
      }
    }
  }

  return dependents;
}

function formatPkgId(pkg) {
  const top = pkg.promoted ? "" : "(fv)";
  return `${logFormat.pkgId(pkg)}${top}`;
}

async function showPkgStat(fyn, pkgs, ask) {
  const dependents = (await findDependents(fyn, pkgs, ask)).sort((a, b) => {
    if (a.name === b.name) {
      return semverUtil.simpleCompare(a.version, b.version);
    }
    return a.name > b.name ? 1 : -1;
  });

  logger.info(logFormat.pkgId(ask), "has these dependents", dependents.map(formatPkgId).join(", "));
  return dependents;
}

function _show(fyn, pkgIds, follow) {
  const data = fyn._data;
  return Promise.each(pkgIds, pkgId => {
    const askPkgs = findPkgsById(data.pkgs, pkgId).sort((a, b) =>
      semverUtil.simpleCompare(a.version, b.version)
    );

    if (askPkgs.length === 0) {
      logger.info(chalk.yellow(pkgId), "is not installed");
    } else {
      logger.info(
        chalk.green.bgRed(pkgId),
        "matched these installed versions",
        askPkgs.map(formatPkgId).join(", ")
      );

      return Promise.map(askPkgs, id => showPkgStat(fyn, data.pkgs, id)).then(askDeps => {
        if (follow > 0) {
          return Promise.each(askDeps, deps => {
            const followIds = deps.slice(0, follow).map(x => x.name);

            return _show(fyn, followIds, follow);
          });
        }
      });
    }
  });
}

function showStat(fyn, pkgIds, follow) {
  const spinner = CliLogger.spinners[1];
  logger.addItem({ name: FETCH_META, color: "green", spinner });
  logger.updateItem(FETCH_META, "resolving dependencies...");
  return fyn
    .resolveDependencies()
    .then(() => {
      logger.removeItem(FETCH_META);
      return _show(fyn, pkgIds, follow);
    })
    .catch(err => {
      logger.error(err);
    })
    .finally(() => {
      logger.removeItem(FETCH_META);
    });
}

module.exports = showStat;
