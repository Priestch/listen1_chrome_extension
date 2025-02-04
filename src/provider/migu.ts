import axios from 'axios';
import forge from 'node-forge';
import { cookieRemove, getParameterByName } from '../utils';
import { MusicProvider, MusicResource } from './types';

const provider: MusicProvider = class migu extends MusicResource {
  static Name = 'migu';
  static id = 'mg';
  static searchable = true;
  static support_login = true;
  static hidden = false;
  static displayId = '_MIGU_MUSIC';
  static mg_convert_song(song: any) {
    return {
      id: `mgtrack_${song.copyrightId}`,
      id2: `mgtrack_${song.songId}`,
      title: song.songName,
      artist: song.artists ? song.artists[0].name : song.singer,
      artist_id: `mgartist_${song.artists ? song.artists[0].id : song.singerId}`,
      album: song.albumId !== 1 ? song.album : '',
      album_id: song.albumId !== 1 ? `mgalbum_${song.albumId}` : 'mgalbum_',
      source: 'migu',
      source_url: `https://music.migu.cn/v3/music/song/${song.copyrightId}`,
      img_url: song.albumImgs[1].img,
      // url: `mgtrack_${song.copyrightId}`,
      lyric_url: song.lrcUrl || '',
      tlyric_url: song.trcUrl || '',
      quality: song.toneControl,
      url: song.copyright === 0 ? '' : undefined,
      song_id: song.songId
    };
  }

  static async mg_render_tracks(url: string, page: number) {
    const list_id = getParameterByName('list_id', url)?.split('_').pop();
    const playlist_type = getParameterByName('list_id', url)?.split('_')[0];
    let tracks_url = '';
    switch (playlist_type) {
      case 'mgplaylist':
        tracks_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/user/queryMusicListSongs.do?musicListId=${list_id}&pageNo=${page}&pageSize=50`;
        break;
      case 'mgalbum':
        tracks_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/queryAlbumSong?albumId=${list_id}&pageNo=${page}&pageSize=50`;
        break;
      default:
        break;
    }
    const response = await axios.get(tracks_url);
    const data = playlist_type === 'mgplaylist' ? response.data.list : response.data.songList;
    const tracks = data.map((item: any) => this.mg_convert_song(item));
    return tracks;
  }

  static async mg_show_toplist(offset: number) {
    if (offset !== undefined && offset > 0) {
      return [];
    }

    const url = 'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/rank-list/release?dataVersion=1616469593718&templateVersion=9';

    const response = await axios.get(url);
    const migu_board = response.data.data.contentItemList[4].itemList.map((item: any) => ({
      cover_img_url: item.imageUrl,
      title: item.displayLogId.param.rankName,
      id: `mgtoplist_${item.displayLogId.param.rankId}`,
      source_url: ''
    }));
    migu_board.splice(0, 2);
    const global_board = response.data.data.contentItemList[7].itemList.map((item: any) => ({
      cover_img_url: item.imageUrl,
      title: item.displayLogId.param.rankName,
      id: `mgtoplist_${item.displayLogId.param.rankId}`,
      source_url: ''
    }));
    const chart_board = [
      {
        cover_img_url: 'https://cdnmusic.migu.cn/tycms_picture/20/02/36/20020512065402_360x360_2997.png',
        title: '尖叫新歌榜',
        id: 'mgtoplist_27553319',
        source_url: ''
      },
      {
        cover_img_url: 'https://cdnmusic.migu.cn/tycms_picture/20/04/99/200408163640868_360x360_6587.png',
        title: '尖叫热歌榜',
        id: 'mgtoplist_27186466',
        source_url: ''
      },
      {
        cover_img_url: 'https://cdnmusic.migu.cn/tycms_picture/20/04/99/200408163702795_360x360_1614.png',
        title: '尖叫原创榜',
        id: 'mgtoplist_27553408',
        source_url: ''
      }
    ];
    const result = chart_board.concat(migu_board, global_board);
    return result;
  }

  static async showPlaylist(url: string) {
    const offset = Number(getParameterByName('offset', url));
    const filterId = getParameterByName('filter_id', url);
    if (filterId === 'toplist') {
      return this.mg_show_toplist(offset);
    }
    const pageSize = 30;
    let target_url = '';
    if (!filterId) {
      target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/getMusicData.do?count=${pageSize}&start=${offset / pageSize + 1}&templateVersion=5&type=1`;
    } else {
      target_url = `https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-listbytag?pageNumber=${
        offset / pageSize + 1
      }&tagId=${filterId}&templateVersion=1`;
      // const target_url = `https://m.music.migu.cn/migu/remoting/playlist_bycolumnid_tag?playListType=2&type=1&columnId=15127315&tagId=&startIndex=${offset}`;
      // columnId=15127315为推荐，15127272为最新
    }

    const response = await axios.get(target_url);
    const data = !filterId ? response.data.data.contentItemList[0].itemList : response.data.data.contentItemList.itemList;
    /** @type {{cover_img_url:string;id:string;source_url:string;title:string}[]}*/
    const result = data.map((item: any) => {
      const match = /id=([0-9]+)&/.exec(item.actionUrl);
      const id = match ? match[1] : '';
      return {
        cover_img_url: item.imageUrl,
        title: item.title,
        id: `mgplaylist_${id}`,
        source_url: `https://music.migu.cn/v3/music/playlist/${id}`
      };
    });
    return result;
  }

  static async mg_toplist(url: string) {
    const list_id = Number(getParameterByName('list_id', url)?.split('_').pop());

    const board_list: Record<number, any> = {
      27553319: {
        name: '尖叫新歌榜',
        url: 'jianjiao_newsong',
        img: '/20/02/36/20020512065402_360x360_2997.png'
      },
      27186466: {
        name: '尖叫热歌榜',
        url: 'jianjiao_hotsong',
        img: '/20/04/99/200408163640868_360x360_6587.png'
      },
      27553408: {
        name: '尖叫原创榜',
        url: 'jianjiao_original',
        img: '/20/04/99/200408163702795_360x360_1614.png'
      },
      23189399: {
        name: '内地榜',
        url: 'mainland',
        img: '/20/08/231/200818095104122_327x327_4971.png'
      },
      23189800: {
        name: '港台榜',
        url: 'hktw',
        img: '/20/08/231/200818095125191_327x327_2382.png'
      },
      19190036: {
        name: '欧美榜',
        url: 'eur_usa',
        img: '/20/08/231/200818095229556_327x327_1383.png'
      },
      23189813: {
        name: '日韩榜',
        url: 'jpn_kor',
        img: '/20/08/231/200818095259569_327x327_4628.png'
      },
      23190126: {
        name: '彩铃榜',
        url: 'coloring',
        img: '/20/08/231/200818095356693_327x327_7955.png'
      },
      15140045: {
        name: 'KTV榜',
        url: 'ktv',
        img: '/20/08/231/200818095414420_327x327_4992.png'
      },
      15140034: {
        name: '网络榜',
        url: 'network',
        img: '/20/08/231/200818095442606_327x327_1298.png'
      },
      23218151: {
        name: '新专辑榜',
        url: 'newalbum',
        img: '/20/08/231/200818095603246_327x327_7480.png'
      },
      33683712: {
        name: '数字专辑畅销榜',
        url: '',
        img: 'https://d.musicapp.migu.cn/prod/file-service/file-down/bcb5ddaf77828caee4eddc172edaa105/2297b53efa678bbc8a5b83064622c4c8/ebfe5bff9fd9981b5ae1c043f743bfb3'
      },
      23217754: {
        name: 'MV榜',
        url: 'mv',
        img: '/20/08/231/200818095656365_327x327_8344.png'
      },
      21958042: {
        name: '美国iTunes榜',
        url: 'itunes',
        img: '/20/08/231/200818095755771_327x327_9250.png'
      },
      21975570: {
        name: '美国billboard榜',
        url: 'billboard',
        img: '/20/08/231/20081809581365_327x327_4636.png'
      },
      22272815: {
        name: 'Hito中文榜',
        url: 'hito',
        img: '/20/08/231/200818095834912_327x327_5042.png'
      },
      22272943: {
        name: '韩国Melon榜',
        url: 'mnet',
        img: '/20/08/231/200818095926828_327x327_3277.png'
      },
      22273437: {
        name: '英国UK榜',
        url: 'uk',
        img: '/20/08/231/200818095950791_327x327_8293.png'
      }
    };
    let target_url = '';
    target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do?columnId=${list_id}&needAll=0`;

    const { data } = await axios.get(target_url);

    const info = {
      cover_img_url: list_id === 33683712 ? board_list[list_id].img : `https://cdnmusic.migu.cn/tycms_picture${board_list[list_id].img}`,
      description: data.columnInfo?.columnDes,
      id: `mgtoplist_${list_id}`,
      title: data.data ? data.data.columnInfo.title : board_list[list_id].name,
      source_url: `https://music.migu.cn/v3/music/top/${board_list[list_id].url}`
    };

    const tracks = data.columnInfo.contents.map((item: any) => this.mg_convert_song(item.objectInfo));
    return {
      tracks,
      info
    };
  }

  static async mg_get_playlist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_').pop();

    const info_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?needSimple=00&resourceType=2021&resourceId=${list_id}`;
    const response = await axios.get(info_url);

    const info = {
      id: `mgplaylist_${list_id}`,
      description: response.data.resource[0].summary,
      cover_img_url: response.data.resource[0].imgItem.img,
      title: response.data.resource[0].title,
      source_url: `https://music.migu.cn/v3/music/playlist/${list_id}`
    };
    const total = response.data.resource[0].musicNum;
    const page = Math.ceil(total / 50);
    const page_array = Array.from({ length: page }, (v, k) => k + 1);
    const tracks = (await Promise.all(page_array.map((page) => this.mg_render_tracks(url, page)))).flat();
    return { tracks, info };
  }

  static async mg_album(url: string) {
    const album_id = getParameterByName('list_id', url)?.split('_').pop();

    const info_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?needSimple=00&resourceType=2003&resourceId=${album_id}`;
    const { data } = await axios.get(info_url);
    const info = {
      cover_img_url: data.resource[0].imgItems[1].img,
      description: data.resource[0].summary,
      id: `mgalbum_${album_id}`,
      title: data.resource[0].title,
      source_url: `https://music.migu.cn/v3/music/album/${album_id}`
    };
    const total = data.resource[0].totalCount;
    const page = Math.ceil(total / 50);
    const page_array = Array.from({ length: page }, (v, k) => k + 1);
    const tracks = (await Promise.all(page_array.map((page) => this.mg_render_tracks(url, page)))).flat();
    return {
      tracks,
      info
    };
  }

  static async mg_artist(url: string) {
    const artist_id = getParameterByName('list_id', url)?.split('_').pop();
    const offset = Number(getParameterByName('offset', url));
    const pageSize = 50;
    const page = offset / pageSize + 1;
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/singer_songs.do?pageNo=${page}&pageSize=${pageSize}&resourceType=2&singerId=${artist_id}`;
    const { data } = await axios.get(target_url);
    const info = {
      id: `mgartist_${artist_id}`,
      description: data.singer.summary,
      cover_img_url: data.singer.imgs[1].img,
      title: data.singer.singer,
      source_url: `https://music.migu.cn/v3/music/artist/${artist_id}/song`
    };

    const tracks = data.songlist.map((item: any) => this.mg_convert_song(item));
    return {
      tracks,
      info
    };
  }
  static async init(track: any) {
    const sound = {} as any;
    const songId = track.song_id;
    let toneFlag = 'PQ';
    switch (track.quality) {
      case '110000':
        toneFlag = 'HQ';
        break;
      case '111100':
        toneFlag = 'SQ';
        break;
      case '111111':
        toneFlag = 'ZQ';
        break;
      default:
        toneFlag = 'PQ';
    }
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/strategy/listen-url/v2.2?netType=01&resourceType=E&songId=${songId}&toneFlag=${toneFlag}`;
    const { data } = await axios.get(target_url, {
      headers: {
        channel: '0146951',
        uid: '1234'
      }
    });
    let playUrl: string = data.data?.url || null;
    if (playUrl) {
      if (playUrl.startsWith('//')) {
        playUrl = `https:${playUrl}`;
      }
      sound.url = playUrl.replace(/\+/g, '%2B'); // eslint-disable-line no-param-reassign
      sound.platform = 'migu';
      switch (toneFlag) {
        case 'HQ':
          sound.bitrate = '320kbps';
          break;
        case 'SQ':
          sound.bitrate = '999kbps';
          break;
        case 'ZQ':
          sound.bitrate = '999kbps';
          break;
        default:
          sound.bitrate = '128kbps';
      }
      return sound;
    } else {
      throw 'migu:init(): no play url';
    }
  }
  static bootstrapTrack(track: any, success: CallableFunction, failure: CallableFunction) {
    const sound = {} as any;
    const songId = track.song_id;
    /*
    const copyrightId = track.id.slice('mgtrack_'.length);
    const type = 1;
    // NOTICE：howler flac support is not ready for production.
    // Sometimes network keep pending forever and block later music.
    // So use normal quality.

    // switch (track.quality) {
    //   case '110000':
    //     type = 2;
    //     break;
    //   case '111100':
    //     type = 3;
    //     break;
    //   case '111111':
    //     type = 4;
    //     break;
    //   default:
    //     type = 1;
    // }
    const k =
      '4ea5c508a6566e76240543f8feb06fd457777be39549c4016436afda65d2330e';
    // type parameter for music quality: 1: normal, 2: hq, 3: sq, 4: zq, 5: z3d
    const plain = forge.util.createBuffer(
      `{"copyrightId":"${copyrightId}","type":${type},"auditionsFlag":0}`
    );
    const salt = forge.random.getBytesSync(8);
    const derivedBytes = forge.pbe.opensslDeriveBytes(k, salt, 48);
    const buffer = forge.util.createBuffer(derivedBytes);
    const key = buffer.getBytes(32);
    const iv = buffer.getBytes(16);

    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv });
    cipher.update(plain);
    cipher.finish();
    const output = forge.util.createBuffer();
    output.putBytes('Salted__');
    output.putBytes(salt);
    output.putBuffer(cipher.output);
    const aesResult = forge.util.encode64(output.bytes());

    const publicKey =
      '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8asrfSaoOb4je+DSmKdriQJKW\nVJ2oDZrs3wi5W67m3LwTB9QVR+cE3XWU21Nx+YBxS0yun8wDcjgQvYt625ZCcgin\n2ro/eOkNyUOTBIbuj9CvMnhUYiR61lC1f1IGbrSYYimqBVSjpifVufxtx/I3exRe\nZosTByYp4Xwpb1+WAQIDAQAB\n-----END PUBLIC KEY-----';
    const secKey = forge.util.encode64(
      forge.pki.publicKeyFromPem(publicKey).encrypt(k)
    );

    const target_url = `https://music.migu.cn/v3/api/music/audioPlayer/getPlayInfo?dataType=2&data=${encodeURIComponent(
      aesResult
    )}&secKey=${encodeURIComponent(secKey)}`;
    */
    let toneFlag = 'PQ';
    switch (track.quality) {
      case '110000':
        toneFlag = 'HQ';
        break;
      case '111100':
        toneFlag = 'SQ';
        break;
      case '111111':
        toneFlag = 'ZQ';
        break;
      default:
        toneFlag = 'PQ';
    }
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/strategy/listen-url/v2.2?netType=01&resourceType=E&songId=${songId}&toneFlag=${toneFlag}`;
    axios
      .get(target_url, {
        headers: {
          channel: '0146951',
          uid: '1234'
        }
      })
      .then((response) => {
        // const { data } = response.data;
        // let playUrl = response.data.data ? response.data.data.playUrl : null;
        let playUrl = response.data.data ? response.data.data.url : null;
        if (playUrl) {
          if (playUrl.startsWith('//')) {
            playUrl = `https:${playUrl}`;
          }
          sound.url = playUrl.replace(/\+/g, '%2B'); // eslint-disable-line no-param-reassign
          sound.platform = 'migu';
          switch (toneFlag) {
            case 'HQ':
              sound.bitrate = '320kbps';
              break;
            case 'SQ':
              sound.bitrate = '999kbps';
              break;
            case 'ZQ':
              sound.bitrate = '999kbps';
              break;
            default:
              sound.bitrate = '128kbps';
          }
          success(sound);
        } else {
          failure(sound);
        }
      })
      .catch(() => failure(sound));
  }

  static async search(url: string) {
    const keyword = getParameterByName('keywords', url) || '';
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    const sid = (this.uuid() + this.uuid()).replace(/-/g, '');
    // let type ='';
    let searchSwitch = '';
    let target_url = 'https://jadeite.migu.cn/music_search/v2/search/searchAll?';
    switch (searchType) {
      case '0':
        searchSwitch = '{"song":1}'; // {"song":1,"album":0,"singer":0,"tagSong":1,"mvSong":0,"bestShow":1,"songlist":0,"lyricSong":0}
        // type = 2;
        target_url =
          `${target_url}sid=${sid}&isCorrect=1&isCopyright=1` +
          `&searchSwitch=${encodeURIComponent(searchSwitch)}&pageSize=20` +
          `&text=${encodeURIComponent(keyword)}&pageNo=${curpage}` +
          '&feature=1000000000&sort=1';
        break;
      case '1':
        searchSwitch = '{"songlist":1}';
        // type = 6;
        target_url =
          `${target_url}sid=${sid}&isCorrect=1&isCopyright=1` +
          `&searchSwitch=${encodeURIComponent(searchSwitch)}` +
          '&userFilter=%7B%22songlisttag%22%3A%5B%5D%7D&pageSize=20' +
          `&text=${encodeURIComponent(keyword)}&pageNo=${curpage}` +
          // + `&sort=1&userSort=%7B%22songlist%22%3A%22default%22%7D`;
          '&feature=0000000010&sort=1';
        break;
      default:
        break;
    }
    // const target_url = `https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/content/search_all.do?&isCopyright=0&isCorrect=0&text=${keyword}&pageNo=${curpage}&searchSwitch=${searchSwitch}`;
    // const target_url = `https://m.music.migu.cn/migu/remoting/scr_search_tag?rows=20&type=${type}&keyword=${keyword}'&pgc=${curpage}`;

    const deviceId = forge.md.md5.create().update(this.uuid().replace(/-/g, '')).digest().toHex().toLocaleUpperCase(); // 设备的UUID
    const timestamp = Date.now().toString();
    const signature_md5 = '6cdc72a439cef99a3418d2a78aa28c73'; // app签名证书的md5
    const text = `${keyword + signature_md5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${timestamp}`;
    const sign = forge.md.md5.create().update(forge.util.encodeUtf8(text)).digest().toHex();
    const headers = {
      // android_id: 'db2cd8c4cdc1345f',
      appId: 'yyapp2',
      // brand: 'google',
      // channel: '0147151',
      deviceId,
      // HWID: '',
      // IMEI: '',
      // IMSI: '',
      // ip: '192.168.1.101',
      // mac: '02:00:00:00:00:00',
      // 'mgm-Network-standard': '01',
      // 'mgm-Network-type': '04',
      // mode: 'android',
      // msisdn: '',
      // OAID: '',
      // os: 'android 7.0',
      // osVersion: 'android 7.0',
      // platform: 'G011C',
      sign,
      timestamp,
      // ua: 'Android_migu',
      // uid: '',
      uiVersion: 'A_music_3.3.0',
      version: '7.0.4'
    };
    const response = await axios.get(target_url, {
      headers
    });
    const { data } = response;
    let result = [];
    let total = 0;
    if (searchType === '0') {
      if (data.songResultData.result) {
        result = data.songResultData.result.map((item: any) => this.mg_convert_song(item));
        total = data.songResultData.totalCount;
      }
    } else if (searchType === '1') {
      if (data.songListResultData.result) {
        result = data.songListResultData.result.map((item: any) => ({
          // result = data.songLists.map(item => ({
          id: `mgplaylist_${item.id}`,
          title: item.name,
          source: 'migu',
          source_url: `https://music.migu.cn/v3/music/playlist/${item.id}`,
          // img_url: item.img,
          img_url: item.musicListPicUrl,
          url: `mgplaylist_${item.id}`,
          author: item.userName,
          count: item.musicNum
        }));
        total = data.songListResultData.totalCount;
      }
    }
    return {
      result,
      total,
      type: searchType
    };
  }

  // https://abhishekdutta.org/blog/standalone_uuid_generator_in_javascript.html
  static uuid() {
    const temp_url = URL.createObjectURL(new Blob());
    const strTemp = temp_url.toString();
    URL.revokeObjectURL(temp_url);
    return strTemp.substr(strTemp.lastIndexOf('/') + 1); // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
  }

  static async lyric(url: string) {
    const lyric_url = getParameterByName('lyric_url', url) as string;
    const tlyric_url = getParameterByName('tlyric_url', url);
    if (lyric_url !== 'null') {
      const p1 = async () => {
        if (lyric_url) {
          return (await axios.get(lyric_url)).data;
        } else {
          return '[00:00.00]暂无歌词\r\n[00:02.00]\r\n';
        }
      };
      const p2 = async () => {
        if (tlyric_url) {
          return (await axios.get(lyric_url)).data;
        } else {
          return '';
        }
      };
      const [lyric, tlyric] = await Promise.all([p1(), p2()]);
      const data = this.mg_generate_translation(lyric, tlyric);
      return { lyric: data.lrc, tlyric: data.tlrc };
    } else {
      const song_id = getParameterByName('track_id', url)?.split('_').pop();
      const target_url = `https://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${song_id}`;
      const { lyric, translatedLyric } = (await axios.get(target_url)).data;
      const data = this.mg_generate_translation(lyric, translatedLyric);
      return { lyric: data.lrc, tlyric: data.tlrc };
    }
  }

  static mg_generate_translation(plain: string, translation: string) {
    if (!translation) {
      return {
        lrc: plain,
        tlrc: ''
      };
    }
    const arr_plain = plain.split('\n');
    let arr_translation = translation.split('\n');
    // 歌词和翻译顶部信息不一定都有，会导致行列对不齐，所以删掉
    const reg_head = /\[(ti|ar|al|by|offset|kana|high):/;
    let plain_head_line = 0;
    let trans_head_line = 0;
    for (let i = 0; i < 7; i += 1) {
      if (reg_head.test(arr_plain[i])) {
        plain_head_line += 1;
      }
      if (reg_head.test(arr_translation[i])) {
        trans_head_line += 1;
      }
    }
    arr_plain.splice(0, plain_head_line);
    arr_translation.splice(0, trans_head_line);
    // 删除翻译与原歌词重复的歌曲名，歌手、作曲、作词等信息
    const reg_info = /(\u4f5c|\u7f16)(\u8bcd|\u66f2)|\u6b4c(\u624b|\u66f2)\u540d|Written by/;
    let trans_info_line = 0;
    for (let i = 0; i < 6; i += 1) {
      if (reg_info.test(arr_translation[i])) {
        trans_info_line += 1;
      }
    }
    arr_translation = arr_translation.splice(trans_info_line);
    const tlrc = arr_translation.join('\r\n');
    return {
      lrc: plain,
      tlrc
    };
  }

  static async parseUrl(url: string) {
    let result;
    // eslint-disable-next-line no-param-reassign
    url = url.replace('music.migu.cn/v3/my/playlist/', 'music.migu.cn/v3/music/playlist/');
    const regex = /\/\/music.migu.cn\/v3\/music\/playlist\/([0-9]+)/g;
    const regex_result = regex.exec(url);
    if (regex_result) {
      result = {
        type: 'playlist',
        id: `mgplaylist_${regex_result[1]}`
      };
    }
    return result;
  }

  static getPlaylist(url: string) {
    const list_id = getParameterByName('list_id', url)?.split('_')[0];
    switch (list_id) {
      case 'mgplaylist':
        return this.mg_get_playlist(url);
      case 'mgalbum':
        return this.mg_album(url);
      case 'mgartist':
        return this.mg_artist(url);
      case 'mgtoplist':
        return this.mg_toplist(url);
      default:
        return null;
    }
  }

  static async getPlaylistFilters() {
    let target_url = 'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-hottaglist/release';
    const response = await axios.get(target_url);
    const recommend = response.data.data.contentItemList.map((item: any) => ({
      id: item.tagId,
      name: item.tagName
    }));
    recommend.unshift({ id: '', name: '推荐' }, { id: 'toplist', name: '排行榜' });
    target_url = 'https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/musiclistplaza-taglist/release?templateVersion=1';
    const res = await axios.get(target_url);
    const all = res.data.data.map((cate: any) => {
      const result = { category: cate.header.title } as any;
      result.filters = cate.content.map((item: any) => ({
        id: item.texts[1],
        name: item.texts[0]
      }));
      return result;
    });
    return {
      recommend,
      all
    };
  }

  static async getUser() {
    const ts = +new Date();
    const url = `https://music.migu.cn/v3/api/user/getUserInfo?_=${ts}`;
    const res = await axios.get(url);
    let result = { is_login: false } as any;
    let status = 'fail';

    if (res.data.success) {
      status = 'success';
      const { data } = res;
      result = {
        is_login: true,
        user_id: data.user.uid,
        user_name: data.user.mobile,
        nickname: data.user.nickname,
        avatar: 'https:' + data.user.avatar.smallAvatar,
        platform: 'migu',
        data
      };
    }

    return {
      status,
      data: result
    };
  }

  static getLoginUrl() {
    return `https://music.migu.cn`;
  }

  static logout() {
    const removeFn = (url: string, name: string) =>
      cookieRemove(
        {
          url,
          name
        },
        () => {
          // empty block
        }
      );
    const musicCookieList = [
      'migu_music_sid',
      'migu_music_platinum',
      'migu_music_level',
      'migu_music_nickname',
      'migu_music_avatar',
      'migu_music_uid',
      'migu_music_credit_level',
      'migu_music_passid',
      'migu_music_email',
      'migu_music_msisdn',
      'migu_music_status'
    ];
    const passportCookieList = ['USessionID', 'LTToken'];
    musicCookieList.map((name) => removeFn('https://music.migu.cn', name));
    passportCookieList.map((name) => removeFn('https://passport.migu.cn', name));
  }

  static async getCommentList(trackId: string, offset: number, limit: number) {
    if (trackId === undefined) {
      return { comments: [], total: 0, offset, limit };
    }
    limit = 5;
    const page = offset / limit + 1;
    const miguId = trackId.split('_')[1];
    const target_url = `https://music.migu.cn/v3/api/comment/listTopComments?targetId=${miguId}&pageSize=${limit}&pageNo=${page}`;
    const response = await axios.get(target_url);

    let comments = [];
    if (response.data.data.items) {
      comments = response.data.data.items.map((item: any) => ({
        id: item.commentId,
        content: item.body,
        time: item.createTime,
        nickname: item.author.name,
        avatar: item.author.avatar && item.author.avatar.startsWith('//') ? `http:${item.author.avatar}` : item.author.avatar,
        user_id: item.author.id,
        like: item.praiseCount,
        reply: item.replyCommentList.map((c: any) => ({
          id: c.commentId,
          content: c.body,
          time: c.createTime,
          nickname: c.author.name,
          avatar: c.author.avatar,
          user_id: c.author.id,
          like: c.praiseCount
        }))
      }));
    }

    return { comments, total: comments.length, offset, limit };
  }
};

export default provider;
