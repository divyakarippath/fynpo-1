//

module.exports = {
  title: "should remove a package from package.json",
  getArgs(options) {
    return [].concat(options.baseArgs).concat([`remove`, `mod-g`]);
  }
};
