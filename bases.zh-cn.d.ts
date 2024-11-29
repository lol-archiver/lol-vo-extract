import { Dayjs } from 'dayjs';
import { NamespacelizedLocalizedSequenceTranslatorA, NamespacelizedLocalizedSequenceTranslatorB } from '@nuogz/i18n';



export type TranslatorLogErrorHandle = {
	(...args: Parameters<NamespacelizedLocalizedSequenceTranslatorA>): Error;
	(...args: Parameters<NamespacelizedLocalizedSequenceTranslatorB>): Error;
}


export type Chroma = {
	/** 炫彩ID */
	readonly id: number;

	/** 炫彩名称 */
	readonly name: string;

	/** 炫彩颜色 */
	readonly colors: string[]
};
export type Skin = {
	/** 皮肤ID */
	readonly id: number;

	/** 皮肤名称 */
	readonly name: string;

	/** 皮肤炫彩 */
	readonly chromas: {
		readonly [idChroma: string]: Chroma;
	};
};
export type Champion = {
	/** 英雄ID */
	readonly id: number;

	/** 英雄名称 */
	readonly name: string;

	/** 英雄称号 */
	readonly title: string;

	/** 英雄标识符 */
	readonly slot: string;

	/** 英雄定位 */
	readonly roles: ('fighter' | 'tank' | 'mage' | 'assassin' | 'marksman' | 'support')[];

	/**
	 * 皮肤 或 炫彩
	 * - 如果是`皮肤`，则包含皮肤的基本信息
	 * - 如果是`炫彩`，则是指向主皮肤的ID
	 */
	readonly skins: {
		readonly [idSkin: string]: Skin | number;
	}
	/** 技能名称 */
	readonly spells: {
		readonly [spells: string]: string;
	}
};
export type Champions = {
	[idChampion: string]: Champion;
}



/** 原始运行配置 */
export type RawRuncomConfig = {
	readonly rc: string;
	readonly files: string[];
}

export type SkinRuncomConfig = {
	readonly mode: 'skin';

	readonly champion: Champion;
	readonly skin: Skin;

	readonly title: string;

	readonly profile: string;
}
export type SpecifyRuncomConfig = {
	readonly mode: 'specify';

	readonly slot: string;

	readonly title: string;

	readonly profile: string;

	readonly files: string[];
}
/** 经过解析的运行配置 */
export type RuncomConfig = SkinRuncomConfig | SpecifyRuncomConfig;

/** 最终解压配置 */
export type ExtractConfig = {
	/**
	 * 运行模式
	 * #### skin
	 * 皮肤模式：按照游戏文件的命名规律，从资源文件中提取指定皮肤的游戏文件
	 * #### specify
	 * 指定模式：手动提供所有的游戏文件
	 */
	readonly mode: 'skin' | 'specify';

	/**
	 * 英雄
	 * #### 皮肤模式
	 * 来自基础数据库的对应的英雄数据
	 * #### 指定模式
	 * (无意义)
	 */
	readonly champion?: Champion;
	/**
	 * 皮肤
	 * #### 皮肤模式
	 * 来自基础数据库的对应的皮肤数据
	 * #### 指定模式
	 * (无意义)
	 */
	readonly skin?: Skin;
	/**
	 * 标识符，用于匹配文件，以及文件、目录和内容的输出
	 * - 推荐格式：使用横杠分割的英文字母与数字组合
	 * #### 皮肤模式
	 * 被指定皮肤所对应英雄的标识符
	 * #### 指定模式
	 * 自定义标识符
	 */
	readonly slot?: string;

	/**
	 * 标题，用于文件、目录和内容的输出
	 * #### 皮肤模式
	 * (可选) 皮肤名称
	 * #### 指定模式
	 * 自定义标题
	 */
	readonly title: string;
	/**
	 * 手动提供的游戏文件
	 * #### 皮肤模式
	 * (可选) 若提供任意游戏文件，则会跳过`从资源文件提取游戏文件`的步骤
	 * #### 指定模式
	 * 指定模式最重要的配置没有之一
	 */
	readonly filesGame?: string[];

	/**
	 * 提取配置档案名
	 *
	 * 被指定的档案的配置将会以固定的优先级合并为最后的提取配置
	 *
	 * `$`为通用档案，无论用户选择什么档案，`$`档案的配置都会被合并。
	 *
	 * 配置优先级由高到低如下：
	 * - runcom
	 * - user[profile]
	 * - user.$
	 * - default[profile]
	 * - default.$
	 */
	readonly profile: string;

	/**
	 * 提取语言，影响皮肤模式游戏文件匹配和程序日志输出
	 * - 默认值：zh_cn
	 * #### 皮肤模式
	 * 影响皮肤模式游戏文件匹配，和最终提取出的语音的语音
	 * #### 指定模式
	 * (可选) 尽管在指定模式下，该配置不会影响语音内容提取和条件匹配，但仍然建议选择与内容匹配的语音，用于区分同一内容的不同语音。
	 *
	 * 如，同时提取同一地图的两种语音的播报语音，提供对应的配置可以在输出的台词文件名和语音目录文件夹上有所区别
	 */
	readonly lang: 'zh_cn' | 'en_us' | string;
	/**
	 * 游戏文件路径中的语言
	 * - 默认值：en_us
	 * - 特殊值：`{lang}` = 同一配置中的`lang`的值
	 * #### 皮肤模式
	 * 在旧版本的客户端中，多语言游戏文件的路径中的语言，往往与客户端语音相同，且有被打包在对应的多语言文件。
	 * 而新版本的客户端中，部分多语言游戏文件的路径中的语言，尽管扔被打包在对应的多语言文件，但游戏文件的路径被固定`en_us`。
	 *
	 * 如，蔚的中文语音文件：
	 * - 旧版本：被打包在`vi.zh_cn.wad.client`中，游戏文件路径是`.../vo/zh_cn/.../vi_*.wpk`
	 * - 新版本：被打包在`vi.zh_cn.wad.client`中，游戏文件路径是`.../vo/en_us/.../vi_*.wpk`
	 * #### 指定模式
	 * (无意义)
	 */
	readonly langInGame?: 'en_us' | 'zh_cn' | string;
	/**
	 * 提取音频格式
	 * - 默认值：wav
	 * - `wav`，使用`Ravioli Game Tool`转换的格式
	 * - `ogg`，使用`Ravioli Game Tool`转换的格式
	 * - `wem`，资源文件中打包的原始格式
	 */
	readonly format: 'wav' | 'ogg' | 'wem',

	/**
	 * 资源文件来源
	 * - 默认值：client
	 * #### 皮肤模式
	 * - `client`，从指定的客户端中资源文件
	 * - `cache`，从指定的CDN中下载资源文件。如果有下载缓存优先使用缓存
	 * - `fetch`，从指定的CDN中下载资源文件。无视下载缓存，强制下载资源文件
	 * - `specify`，手动提供资源文件
	 * #### 指定模式
	 * (无意义)
	 */
	readonly sourceAsset: 'client' | 'cache' | 'fetch' | 'specify';

	/**
	 * 音效文件使用等级
	 * #### 皮肤模式
	 * - `no`，不使用
	 * - `parse`，用于辅助匹配触发条件
	 * - `extract`，用于辅助匹配触发条件并提取
	 * #### 指定模式
	 * (无意义)
	 * */
	readonly levelSoundEffect: 'no' | 'parse' | 'extract';
	/** 是否使用基础皮肤的文件，以辅助匹配触发条件 */
	readonly useBaseSkinFiles: boolean;

	/** 是否跳过提取语音文件 */
	readonly skipExtract: boolean;
	/** 是否跳过保存听写文件 */
	readonly skipSaveDictation: boolean;
	/** 是否用更简短的名称来导出内容 */
	readonly saveWithShort: boolean;
	/** 是否无视提取缓存，强制提取音频 */
	readonly forceExtractFile: boolean;
	/** 导出的文件名是否不包括对应wem文件的哈希 */
	readonly noWEMHash$ExportAudio: boolean;

	/** 是否转存语音事件树 */
	readonly dumpEventTree: boolean,
	/** 需要单独转存语音事件树节点 */
	readonly idsHexEventTreeDump: [],


	/** zstd压缩程序路径 */
	readonly fileZSTD: string;
	/** Ravioli Game Tools里的RExtractor Console程序路径 */
	readonly fileRextractorConsole: string;
	/** VGMStream里的VGMStreamCLI程序路径 */
	readonly fileVGMStreamCLI: string;
	/**
	 * 游戏客户端目录。可能的值：
	 * - `{ExtractConfig.dirGameVoice}`
	*/
	readonly dirGameClient?: string;
	/**
	 * 缓存目录，存放提取过程中临时产生或下载的文件。可能的值：
	 * - `{ExtractConfig.dirCache}`
	 * - `{项目目录}/@cache`
	 */
	readonly dirCache?: string;
	/**
	 * 调试文件导出目录，存放提取时保存的调试文件，可能的值：
	 * - `{项目目录}/debug`
	 */
	readonly dirExportDebug?: string;
	/**
	 * 语音文件导出目录，存放已匹配事件的语音文件。可能的值：
	 * - `{ExtractConfig.dirExportVoice}`
	 * - `{项目目录}/@1voice`
	 */
	readonly dirExportVoice?: string;
	/**
	 * 听写模板文件导出目录，存放已匹配事件的语音文件。可能的值：
	 * - `{ExtractConfig.dirExportDict}`
	 * - `{项目目录}/@2dict`
	 */
	readonly dirExportDict?: string;

	/** 数据插件目录（用于侧功能） */
	readonly dirGameDataPlugin?: string;
	/** 台词文件总目录（用于侧功能） */
	readonly dirDictations: string;
	/** 自动工程目录（用于侧功能） */
	readonly dirAutogen: string;


	/** CDN区域 */
	readonly regionCDN: string;
	/** 资源文件所属的阶段 */
	readonly statgeCDN: string;
	/** 资源文件所属的解决方案 */
	readonly solutionCDN: string;
	/** CDN的cdn地址 */
	readonly cdnCDN: string;
	/** CDN的sie地址 */
	readonly sieCDN: string;
	/** 是否使用代理 */
	readonly proxyCDN: boolean;
} & {
	/** 语音目录缓存名称 */
	readonly nameDirCache: string;
	/** 语音目录输出名称 */
	readonly nameDirVoiceExport: string;
	/** 听写文件输出名称 */
	readonly nameFileDictation: string;
	/** 听写文件输出标题 */
	readonly titleFileDictation: string;

	/**
	 * Asset缓存目录，存放下载的资源文件。可能的值：
	 * - `{缓存目录}/1-asset`
	 */
	readonly dirCacheAsset: string;
	/**
	 * Unpack缓存目录，存放从资源文件中提取的游戏文件。可能的值：
	 * - `{缓存目录}/2-game`
	 */
	readonly dirCacheGame: string;
	/**
	 * Audio缓存目录，存放从游戏文件中提取的音频文件。可能的值：
	 * - `{缓存目录}/3-unpack/{输出名称}`
	 */
	readonly dirCacheAudio: string;


	/** 提取时间 */
	readonly timeExtract: Dayjs;
}
