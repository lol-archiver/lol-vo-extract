> [!NOTE]\
> This document is produced by machine translation
>
> I am not a native English speaker. Sorry if the expression is not clear enough

**English** | [中文](./README.zh.md)

# lol-vo-extract
Extracting League of Legends champion/skin voices and matching them to in-game events

## Special thanks
- Most implementations are refactored from [CDTB](https://github.com/CommunityDragon/CDTB)
  - Heartfelt thanks to this excellent open-source project!
- Thanks to the code from [wwiser](https://github.com/bnnm/wwiser)
  - Before discovering this project,I could only build parsers by analyzing/guessing binary patterns through reverse engineering
  - Its emergence allowed me to fix quite a few potential bugs in parsing bnk/wpk formats.
    This further improved the program's event matching success rate

## Notable on v2
After very LONG delays, and three straight weeks of squeezing time out of my regular job to refactor codes.
Finally I finished the vast majority of v2!

The program is **WORKING** now, I still haven't had the time to finish internationalizing the console outputs and docs!

**In v2, the event matching success rate was greatly improved.**

But I think it is still necessary to keep the following ATTENTION. After all, I'm only analyzing data as a rookie unofficial data miner:

>ATTENTION PLEASE:\
**`lol-vo-extract` does not guarantee 100% match for all events for all skin.**

- Different skins have **different** production dates and packaging formats. The possibility of extracting unknown events still exists..
- Sometimes the literal event and actual trigger are different!

## Requirement
- node.js v24+ (best)
  - node.js v14.18.1+ (maybe still works)
- VGMStream (required if extract format is `wav`)
- Ravioli Game Tools (required if extract format is `ogg`)
- ZSTD (optional, required for unpack game)
  - It is strongly recommended that your node.js version be at least v22.15.0 or higher\
    As built-in support for ZSTD since this version. This built-in support significantly improve data processing efficiency\
    No longer need to specified the `fileZSTD` option (still can if specified, the program will prioritize using `fileZSTD`)

## Usage
This program is a **`config-file-base`** node.js program. No command line. All behavior is specified and adjusted through the config files.

The entry file is **`index.js`**. Audio files will be stored in `@1voice`, and dictation files will be stored in `@2dict` by default:
````batch
cd lol-vo-extract
node index.js
````

## Config Instructions
All configs support both `.jsonc` and `.json` file extensions.

### config.runcom.json
Required\
This config specifies which hero/skin voice lines should be extracted using which `profile`\
Refer to the example in `config.runcom.json.example`

### config.user.json
Required.\
This config contains user-defined `profiles` and must be configured by the user\
Refer to the example in `config.user.json.example`\
For detailed definitions, see `ExtractConfig` in `bases.zh-cn.d.ts` (english version not yet)

Special Keys:
- `$profile`\
  This key specifies the **default** profile to use when no profile is explicitly defined in `config.runcom.json`
- `$base` in a profile\
  This key indicates which profile the current profile is based on, including configs from `config.default.json`

Profiles will be assigned/overridden based on their relationships before extraction.

### config.default.json
This file provides the most basic configs for some preset profiles\
Users can completely override these configs in `config.user.json`

### config.event-manual.json
This config contains internally events manually provided by the user,\
to assist in cases where events cannot be extracted automatically
