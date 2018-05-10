"use strict";

/* eslint-disable no-magic-numbers, max-statements */

const MAX_PENDING_SHOW = 10;
const chalk = require("chalk");
const logFormat = require("./util/log-format");
const logger = require("./logger");
const { LONG_WAIT_PACKAGE } = require("./log-items");

module.exports = {
  onWatch: (items, options) => {
    options = options || {};
    const logItemName = options.name || LONG_WAIT_PACKAGE;

    if (items.total === 0) {
      logger.removeItem(logItemName);
      return;
    }

    let all = items.watched.concat(items.still);

    if (options.filter) all = all.filter(options.filter);

    if (all.length === 0) {
      logger.removeItem(logItemName);
      return;
    }

    if (!logger.hasItem(logItemName)) {
      logger.addItem({
        name: logItemName,
        display: options.display,
        color: "yellow"
      });
    }
    let msg = "";
    if (all.length > MAX_PENDING_SHOW) {
      msg = chalk.cyan(`Total: ${all.length}, first ${MAX_PENDING_SHOW}: `);
    }

    msg += all
      .slice(0, MAX_PENDING_SHOW) // show max 10 pendings
      .map(x => {
        const id = typeof x.item === "string" ? chalk.magenta(x.item) : options.makeId(x.item);
        return `${id} (${logFormat.timeWarn(x.time)})`;
      })
      .join(chalk.blue(", "));

    logger.updateItem(logItemName, {
      msg,
      _save: options._save !== undefined ? options._save : false
    });
  }
};
