export function setPrototypeOfLocalStorage(): void {
  const proto = Object.getPrototypeOf(localStorage);
  proto.getObject = function getObject(key: string) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };
  proto.setObject = function setObject(key: string, value: unknown) {
    this.setItem(key, JSON.stringify(value));
  };
  Object.setPrototypeOf(localStorage, proto);
}

export function arrayMove<T>(arr: T[], old_index: number, new_index: number) {
  // https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
  if (new_index >= arr.length) {
    let k = new_index - arr.length + 1;
    while (k > 0) {
      k -= 1;
      arr.push(undefined as T);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing
}
export function formatTime(secs: number) {
  const minutes = Math.floor(secs / 60) || 0;
  const seconds = Math.round(secs - minutes * 60) || 0;

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
export function getParameterByName(name: string, url: string) {
  if (!url) url = window.location.href;
  const { searchParams } = new URL(url, location.origin);
  return searchParams.get(name);
}
export function htmlDecode(value: string) {
  const parser = new DOMParser();
  return parser.parseFromString(value, 'text/html').body.textContent;
}
export function replaceBR(str: string) {
  return str.replace(/<br>/g, '\n');
}
export function replaceNBSP(str: string) {
  return str.replace(/&nbsp;|&#160;/g, ' ');
}
export function isElectron() {
  return Boolean(window.api?.platform);
}
export function isMac() {
  return window.api?.platform === 'darwin';
}
export function isLinux() {
  return window.api?.platform === 'linux';
}
export function isWin() {
  return window.api?.platform === 'win32';
}

type CookieRequest = chrome.cookies.Details;
interface Cookie extends chrome.cookies.Details, Electron.Cookie {}

export function cookieGet(cookieRequest: CookieRequest, callback: CallableFunction) {
  if (!isElectron()) {
    console.log(cookieRequest);
    return chrome.cookies.get(cookieRequest, (cookie) => {
      callback(cookie);
    });
  }
  window.api.getCookie(cookieRequest).then((cookieArray) => {
    console.log('getCookie', cookieArray);
    let cookie = null;
    if (cookieArray.length > 0) {
      [cookie] = cookieArray;
    }
    callback(cookie);
  });
}
export function cookieGetPromise(cookieRequest: CookieRequest): Promise<Cookie> {
  return new Promise((res) => {
    if (!isElectron()) {
      chrome.cookies.get(cookieRequest, (cookie) => {
        res(cookie as Cookie);
      });
    } else {
      window.api.getCookie(cookieRequest).then((cookieArray) => {
        let cookie = null;
        if (cookieArray.length > 0) {
          [cookie] = cookieArray;
        }
        res(cookie as Cookie);
      });
    }
  });
}

export function cookieSet(cookie: Cookie, callback: CallableFunction) {
  if (!isElectron()) {
    return chrome.cookies.set(cookie, (cookie: chrome.cookies.Cookie | null) => {
      callback(cookie);
    });
  }
  window.api.setCookie(cookie);
  callback(null);
}
export function cookieSetPromise(cookie: Cookie) {
  return new Promise((res) => {
    if (!isElectron()) {
      return chrome.cookies.set(cookie, (cookie: chrome.cookies.Cookie | null) => {
        res(cookie);
      });
    }
    window.api.setCookie(cookie).then(() => {
      res(null);
    });
  });
}

export function cookieRemove(cookieRequest: CookieRequest, callback: CallableFunction) {
  if (!isElectron()) {
    return chrome.cookies.remove(cookieRequest, (req: CookieRequest) => {
      callback(req);
    });
  }
  window.api.removeCookie(cookieRequest.url, cookieRequest.name);
  callback(null);
}

function easeInOutQuad(t: number, b: number, c: number, d: number) {
  // t = current time
  // b = start value
  // c = change in value
  // d = duration
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t -= 1;
  return (-c / 2) * (t * (t - 2) - 1) + b;
}
let animationID = 0;
const getAnimationID = () => animationID;
export function smoothScrollTo(element: Element, to: number, duration: number) {
  if (element == undefined || element === null) {
    return;
  }
  /* https://gist.github.com/andjosh/6764939 */
  const start = element.scrollTop;
  const change = to - start;
  let currentTime = 0;
  const increment = 20;
  animationID = +new Date();

  const animateScroll = (myID: number) => () => {
    currentTime += increment;
    const val = easeInOutQuad(currentTime, start, change, duration);
    element.scrollTop = val;
    if (currentTime < duration && getAnimationID() === myID) {
      setTimeout(animateScroll(myID), increment);
    }
  };
  animateScroll(animationID)();
}

export function async_process(data_list: any[], handler: CallableFunction, handler_extra_param_list: any) {
  return Promise.all(
    data_list.map(
      (item, index: number) =>
        new Promise((res, rej) =>
          handler(index, item, handler_extra_param_list, (err: any, data: any) => {
            if (err) rej(err);
            res(data);
          })
        )
    )
  );
}
