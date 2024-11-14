# CHANGELOG

## v2.2.0 - 2024.11.14 09
* feat: new option `skipSaveDictation`
* refactor!: redesigned loading logic for config profile
  * profiles now support indicating which profile this profile is based on by setting the key value `$base`. When loading configs, it will be based on the base profile's config and then override this profile's own config
  * no need for `$` profile. indicates the key value of the default file to be changed from `$.profile` to `$profile`
  * keys starting with `$` are now considered functional instructions and will be ignored when loading the config
  * now the default-level config and user-level config will be merged into the one config map before assigning any profile bases
* refactor: changed the logic for config `langInGame`.
  * in reference to the recent design of the LOL game files, `langInGame` now defaults to `en_us`
  * `langInGame` now supports the special value `{lang}`, which is equivalent to config `lang`
* chore: added example of user-level config and runcom config
* chore: update `data/friendly-name/zh_cn.js`
* chore: Renamed some of the code files to correspond to the current function names in files


## v2.1.0 - 2024.11.11 18
* refactor!: huge refactor config design!!!
* refactor!: renew all codes
* refactor!: clean some files (wip)
* deps: bump up dependencies
* docs: add types with i18n (wip)
* chore: update base data
* chore: renew develop environments


## v2.0.1 - 2022.09.08.11
* update base data
* update dependencies
* use `@nuogz/pangu@3`
* fix `side/3-convert-base`


## v2.0.0 - 2022.09.01 15
* update import
* use `@nuogz/pangu` to handle all base code
* start use `CHANGLOG.md` from version `v2.0.0`
* tweak all files for using official npm
