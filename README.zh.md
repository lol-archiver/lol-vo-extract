[English](./README.md) | **中文**

# lol-vo-extract
提取《英雄联盟》英雄/皮肤语音，并将其与游戏内事件进行匹配

## 特别感谢
- 大部分实现重构自[CDTB](https://github.com/CommunityDragon/CDTB)
  - 衷心感谢这个优秀的开源项目！
- 感谢[wwiser](https://github.com/bnnm/wwiser)的代码
  - 在我发现这个项目之前，我只能通过分析/猜测二进制模式来建立解析程序
  - 它的出现令我修复了相当多关于解析bnk/wpk格式的潜在错误。这使得程序的事件匹配成功率进一步提升

## v2版本须知
经过漫长的推迟，以及连续三周从日常工作中挤出时间进行代码重构，我终于完成了v2的绝大部分工作！

程序现在已经可以**工作**，但我仍然没有时间完成控制台输出和文档的国际化！

**在v2中，事件匹配的成功率得到了极大提高。**

但我认为仍有必要保留以下注意事项。毕竟，我只是一个非官方的数据挖掘新手，仅仅是在分析数据：
> 请注意：\
**`lol-vo-extract` 不保证能 100% 匹配所有皮肤的所有事件。**

- 不同的皮肤有不同的制作日期和打包格式。提取出未知事件的可能性仍然存在。
- 有时文本事件和实际触发的事件是不同的！

## 要求
- Node.js v24+ (最佳)
  - Node.js v14.18.1+ (可能仍可使用)
- VGMStream (如果提取格式为 `wav` 则需要)
- Ravioli Game Tools (如果提取格式为 `ogg` 则需要)
- ZSTD (可选，解压游戏文件需要)
  - 强烈建议您的Node.js版本至少为v22.15.0或更高\
    因为从该版本开始，内置了对ZSTD支持。这个功能显著提高了数据处理效率\
    不再需要指定`fileZSTD`选项（仍可以指定，程序优先使用`fileZSTD`）

## 使用方法
此程序是一个**基于配置文件**的Node.js程序。没有命令行。所有行为都通过配置文件指定和调整

入口文件是`index.js`。默认情况下，音频文件将存储在 `@1voice` 中，听录文件将存储在 `@2dict` 中：
````batch
cd lol-vo-extract
node index.js
````

## 配置说明
所有配置都支持`.jsonc`和`.json`两种扩展名
### config.runcom.json
必要\
这个配置指定了哪些英雄/皮肤的语音需要用哪个`档案`进行提取\
示例参见`config.runcom.json.example`

### config.user.json
必要\
这个配置包含用户的`档案`，需要用户自行配置\
示例参见`config.user.json.example`\
定义详见`bases.zh-cn.d.ts`中的`ExtractConfig`

特殊键：
- `$profile`\
  这个键指定了在`config.runcom.json`中不指定档案时，**默认**使用哪个档案
- 档案中的`$base`\
  这个键指定了这个档案是基于哪个档案，包括`config.default.json`中的配置。

档案会在提取前根据档案之间的关系合成/覆盖它们的属性

### config.default.json
这个提供了一些预设档案的最基础配置，用户完全可以在`config.user.json`中覆盖这些配置

### config.event-manual.json
这个配置包含用户手动提供的内部事件，以在无法自动提取事件的情况下提供帮助
