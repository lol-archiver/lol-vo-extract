# lol-vo-extract
League of Legends champion voices ~~download~~, extract and save with events.

**Most of implementation based on [CDTB](https://github.com/CommunityDragon/CDTB). Sincerely Thanks!**

**Thanks to [wwiser](https://github.com/bnnm/wwiser)'s code, I fixed quite a few latent bugs regarding parsing the bnk/wpk format. Previously I could only set up parsed files by analyzing/guessing binary patterns. this led to a further increase in the event match rate.**

## Notable on v2.x
(I'm not a native English speaker, so I use a translator for the vast majority of my English content. Sorry if it doesn't come across well enough!)

After very LONG delays, and three straight weeks of squeezing time out of my regular job to refactor codes. Finally I finished the vast majority of v2.x!  

The program is **WORKING** now, I still haven't had the time to finish internationalizing the console outputs and docs!

**In v2.x, the event matching success rate was greatly improved.**

But I think it is still necessary to keep the following ATTENTION. After all, I'm only analyzing data as a rookie unofficial data miner:

>ATTENTION PLEASE:  
**`lol-vo-extract` does not guarantee 100% match for all events for all skin.**
- Different skins have **different** production dates and packaging formats. The possibility of extracting unknown events still exists..
- Sometimes the literal event and actual trigger are different!

## Requirement
- Node.js v20+ (best)
	- Node.js v14.18.1+ (maybe still works)
- ZSTD (required fro unpack game)
- VGMStream (required if extract format is `wav`)
- Ravioli Game Tools (required if extract format is `ogg`)

## Usage
This program is a **`config-file-base`** program. All behavior is specified and adjusted through the configuration files.

The entry file is **`index.js`**. Audio files will be stored in `@1voice`, and dictation files will be stored in `@2dict` by default:
````batch
cd lol-vo-extract
node index
````

## Config
`config.runcom.json` and `config.user.json` are required.
- see example in `config.runcom.json.example`, `config.user.json.example`
- definitions is on `ExtractConfig` in `bases.d.ts` (english version still w.i.p current) 
