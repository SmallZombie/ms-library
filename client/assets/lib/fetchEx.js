/** 所有拦截器 */
const Interceptors = [];
const OriginFetch = window.fetch;


/** fetch 增强 */
function fetchEx(path, ops) {
    if (!path) return;

    // 请求拦截处理
    for (let i = 0; i < Interceptors.length; i++) {
        let temp;
        Interceptors[i].request && (temp = Interceptors[i].request(path, ops));

        temp.path && (path = temp.path);
        temp.ops && (ops = temp.ops);

        if (!temp) return;
    }

    return new Promise((resolve, reject) => {
        function _resolve(res) {
            // 经过响应拦截处理
            Interceptors.forEach(el => el.response && (res = el.response(res)));
            resolve(res);
        }

        let isReject = false;
        function _reject(e, originReq) {
            if (isReject) return;
            isReject = true;

            // 错误处理
            Interceptors.forEach(el => el.err && el.err(e, originReq));
            reject(e);
        }

        OriginFetch(path, ops)
            .then(res => {
                // 处理非 2xx 响应为错误
                // if (res.status < 200 || res.status > 299) _reject(res.status, { path, ops });

                _resolve(res);
            })
            .catch(e => _reject(e, { path, ops }));
    });
}


/** 拦截器，会自动添加到拦截链中 */
class Interceptor {
    request;
    response;
    err;

    constructor(ops) {
        this.request = ops.request;
        this.response = ops.response;
        this.err = ops.err;

        Interceptors.push(this);
    }
}


export { fetchEx, Interceptor }
