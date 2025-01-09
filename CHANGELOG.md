# CHANGELOG

## v2.7.1 - 2025.01.09 15
* chore: update base data
* fix: fixed incorrectly deconstructed unpacked files
* deps: bump up dependencies


## v2.7.0 - 2024.12.16 15
* feat: support for extracting game files from asset files in **specify** mode
  * `config/config.runcom.jsonc.example` has been updated;
* refactor: rename `save-audios` from `copy-audios`
  * update related zh-cn locales
* refactor: finish refactoring log outputs for `save-audios` and `save-dictaion`
* fix: fixed incorrectly calling string-type functions on number-type Event ID
* deps: bump up dependencies


## v2.6.0 - 2024.12.13 15
* feat: support `.jsonc` config file.
* chore: update base data
* chore: tweat side script `concat-audio-50`
* deps: bump up dependencies


## v2.5.0 - 2024.12.11 14
* refactor(config)!: **specify** mode runcom's type changed from `Object` to `Array`
  * the structure within the array is `[rc, ...files]`
  * `runcom[0]` is the former `runcom.rc`
  * `runcom[1+]` is the former `runcom.file`
* feat(config): new config `noAudioIDInExportFileName`
* feat(config): new config `noRegionInExportFileName`
* refactor(config): rename config `noWEMHashInExportFileName` to `noWEMHash$ExportAudio`
* fix(side): fix wrong pick/ban voice matching in side script `copy-audio-with-line`
* chore: update base data
* deps: bump up dependencies


## v2.4.0 - 2024.11.29 16
* refactor: rename dynamic config `slotFile` to `nameDirCache`
* refactor: rename dynamic config `nameFile` to `nameFileDictation`
* refactor: rename dynamic config `titleFile` to `titleFileDictation`
* refactor: rename dynamic config `nameDirExport` to `nameDirVoiceExport`
* revert: now event-related export texts are case-sensitive
* refactor: `HIRCSwitchContainer` has been removed and replaced with `HICRContainer`
* refactor: side script `concat-audio-50` now supports the generation of multiple runcom
  * update the file name format of output audios
* fix: fix `Switches` in `Switch Container` not being shown when dumping event-tree.
* fix: fix wrong import path for `friendly-name` file
* chore: tweak `friendly-name` file
* chore: update base data
* deps: bump up dependencies


## v2.3.0 - 2024.11.14 17
* feat: now when extracting audio in `wav` format, `VGMStream` is used instead of `RExtractor` to convert `wem` files directly to `wav` files.
  * This one change can greatly improve the overall extraction speed!!!
  * still use `RExtractor` to convert audio to ogg format
  * new config `fileVGMStreamCLI`
* feat: console will output a split line while a runcom finished
* refactor: adjust the name of event tree dump file
* refactor: rename dynamic config `dirCacheUnpack` to `dirCacheGame`
* refactor: rename the default value of `dirCacheGame` to `2-game` from `2-unpack`
* fix: fix `data/friendly-name/zh_cn.js`
* fix: fix the bug that dynamic config `titleFile` show skin name as undefined


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
