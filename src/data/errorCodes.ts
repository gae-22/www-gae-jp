export interface ErrorCode {
    code: number;
    name: string;
    title: string;
    message: string;
    description: string;
    priority: 'S' | 'A' | 'B' | 'C';
    designType:
        | 'standard'
        | 'joke'
        | 'retro'
        | 'server_error'
        | 'terminal'
        | 'security'
        | 'network'
        | 'maintenance'
        | 'timeout'
        | 'limit';
    originalSource?: string;
}

export const errorCodes: ErrorCode[] = [
    // Priority S
    {
        code: 400,
        name: 'Bad Request',
        title: 'リクエスト不正',
        message: '何かがおかしいです',
        description:
            '入力内容に誤りがあるようです。ブラウザのキャッシュを削除するか、Cookieをクリアしてから再度お試しください。',
        priority: 'S',
        designType: 'standard',
    },
    {
        code: 401,
        name: 'Unauthorized',
        title: '認証が必要',
        message: 'ログインしてください',
        description: 'このページにアクセスするにはログインが必要です。',
        priority: 'S',
        designType: 'security', // Changed for visual
    },
    {
        code: 403,
        name: 'Forbidden',
        title: 'アクセス禁止',
        message: '立入禁止エリア',
        description:
            'このページへのアクセス権限がありません。トップページへお戻りください。',
        priority: 'S',
        designType: 'security', // Changed for visual
    },
    {
        code: 404,
        name: 'Not Found',
        title: 'ページ未検出',
        message: 'ページが見つかりません',
        description:
            'アクセスしようとしたページは削除されたか、URLが変更されている可能性があります。',
        priority: 'S',
        designType: 'standard',
    },
    {
        code: 500,
        name: 'Internal Server Error',
        title: 'サーバー内部エラー',
        message: 'システムエラー発生',
        description:
            'サーバー内部で予期せぬエラーが発生しました。現在エンジニアが調査中です。しばらく経ってから再度アクセスしてください。',
        priority: 'S',
        designType: 'server_error',
    },
    {
        code: 503,
        name: 'Service Unavailable',
        title: 'サービス利用不可',
        message: 'メンテナンス中 / アクセス集中',
        description:
            '現在メンテナンス中、もしくはアクセス集中によりサービスが利用できません。しばらく時間を置いてから再度お試しください。',
        priority: 'S',
        designType: 'maintenance', // Changed for visual
    },

    // Priority A
    {
        code: 408,
        name: 'Request Timeout',
        title: 'タイムアウト',
        message: '通信がタイムアウトしました',
        description: '通信状況が良い場所で、再度お試しください。',
        priority: 'A',
        designType: 'timeout', // Changed for visual
    },
    {
        code: 410,
        name: 'Gone',
        title: '消滅した',
        message: 'このページは永遠に削除されました',
        description:
            'アクセスしようとしたページは削除されました。復活することはありません。',
        priority: 'A',
        designType: 'standard',
    },
    {
        code: 413,
        name: 'Payload Too Large',
        title: 'データ過大',
        message: 'ファイルが大きすぎます',
        description:
            '送信しようとしたファイルのサイズが大きすぎます。圧縮してから再度お試しください。',
        priority: 'A',
        designType: 'limit', // Changed for visual
    },
    {
        code: 414,
        name: 'URI Too Long',
        title: 'URLが長すぎ',
        message: 'URLが長すぎます',
        description: 'URLが長すぎて処理できません。正しいURLかご確認ください。',
        priority: 'A',
        designType: 'standard',
    },
    {
        code: 419,
        name: 'Page Expired',
        title: 'ページ期限切れ',
        message: 'セッションが切れました',
        description:
            'セッションのタイムアウト等の可能性があります。画面を更新してから再度お試しください。',
        priority: 'A',
        designType: 'timeout', // Changed for visual
    },
    {
        code: 429,
        name: 'Too Many Requests',
        title: 'リクエスト過多',
        message: '落ち着いてください',
        description:
            'リクエストが多すぎます。しばらく時間を置いてから再度お試しください。',
        priority: 'A',
        designType: 'limit', // Changed for visual
    },
    {
        code: 502,
        name: 'Bad Gateway',
        title: '不正なゲートウェイ',
        message: '通信経路のトラブル',
        description:
            'サーバーへの通信経路で一時的なエラーが発生しています。しばらく時間を置いてから再度お試しください。',
        priority: 'A',
        designType: 'network', // Changed for visual
    },
    {
        code: 504,
        name: 'Gateway Timeout',
        title: 'ゲートウェイタイムアウト',
        message: 'サーバーからの応答がありません',
        description:
            'サーバーの応答に時間がかかっています。しばらく時間を置いてから再度お試しください。',
        priority: 'A',
        designType: 'timeout', // Changed for visual
    },

    // Priority B (Joke / Easter Egg)
    {
        code: 418,
        name: "I'm a teapot",
        title: '私はティーポット',
        message: '私はティーポットです',
        description: '私はティーポットです。コーヒーを入れることはできません。',
        priority: 'B',
        designType: 'joke',
        originalSource: 'RFC 2324',
    },
    {
        code: 451,
        name: 'Unavailable For Legal Reasons',
        title: '法的理由で利用不可',
        message: 'このページは表示できません',
        description: 'このコンテンツは法的理由により表示できません。',
        priority: 'B',
        designType: 'joke',
        originalSource: 'Fahrenheit 451',
    },
    {
        code: 402,
        name: 'Payment Required',
        title: '支払いが必要',
        message: 'ここから先は有料です（嘘）',
        description: 'このコンテンツへのアクセスには支払いが必要です（デモ）。',
        priority: 'B',
        designType: 'joke',
    },
    {
        code: 420,
        name: 'Enhance Your Calm',
        title: '落ち着け',
        message: '深呼吸しましょう',
        description: '落ち着いて深呼吸しましょう。リラックスしてください。',
        priority: 'B',
        designType: 'joke',
        originalSource: 'Twitter API / Demolition Man',
    },
    {
        code: 417,
        name: 'Expectation Failed',
        title: '期待に答えられない',
        message: 'あなたの期待には応えられませんでした...',
        description: 'ご期待に添うことができませんでした。申し訳ありません。',
        priority: 'B',
        designType: 'joke',
    },
    {
        code: 425,
        name: 'Too Early',
        title: '早すぎる',
        message: '君が来るのはまだ早かったようだ...',
        description:
            'まだその時ではありません。準備ができるまでお待ちください。',
        priority: 'B',
        designType: 'joke',
    },

    // Priority C (Maniac)
    {
        code: 405,
        name: 'Method Not Allowed',
        title: 'メソッド不許可',
        message: 'その操作は許可されていません',
        description:
            '許可されていない操作（メソッド）です。トップページへお戻りください。',
        priority: 'C',
        designType: 'terminal',
    },
    {
        code: 406,
        name: 'Not Acceptable',
        title: '受理不可',
        message: 'ご希望の形式ではお出しできません',
        description: 'リクエストされた形式での応答ができません。',
        priority: 'C',
        designType: 'standard',
    },
    {
        code: 409,
        name: 'Conflict',
        title: '競合',
        message: '既に他の人が変更しました',
        description:
            '他のユーザーによって変更が行われたため、保存できませんでした。最新の状態を確認してください。',
        priority: 'C',
        designType: 'joke', // Using joke type for git conflict visual
    },
    {
        code: 422,
        name: 'Unprocessable Entity',
        title: '処理できない内容',
        message: '入力内容に誤りがあります',
        description:
            '入力内容に誤りがあります。内容をご確認の上、再度お試しください。',
        priority: 'C',
        designType: 'standard',
    },
    {
        code: 509,
        name: 'Bandwidth Limit Exceeded',
        title: '帯域幅制限超過',
        message: '今月のアクセス上限を超えました',
        description: '転送量制限を超過しました。来月までお待ちください。',
        priority: 'C',
        designType: 'limit', // Changed for visual
    },
    // Cloudflare Errors (520-527)
    {
        code: 520,
        name: 'Web Server Returned an Unknown Error',
        title: 'Cloudflare Error',
        message: 'Webサーバーが不明なエラーを返しました',
        description:
            'Webサーバーが不明なエラーを返しました。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'network', // Changed for visual
    },
    {
        code: 521,
        name: 'Web Server Is Down',
        title: 'Cloudflare Error',
        message: 'Webサーバーがダウンしています',
        description:
            'Webサーバーがダウンしています。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'network', // Changed for visual
    },
    {
        code: 522,
        name: 'Connection Timed Out',
        title: 'Cloudflare Error',
        message: '接続がタイムアウトしました',
        description:
            'Webサーバーへの接続がタイムアウトしました。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'network', // Changed for visual
    },
    {
        code: 523,
        name: 'Origin Is Unreachable',
        title: 'Cloudflare Error',
        message: 'オリジンサーバーに到達できません',
        description:
            'オリジンサーバーへの接続ができません。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'network', // Changed for visual
    },
    {
        code: 524,
        name: 'A Timeout Occurred',
        title: 'Cloudflare Error',
        message: 'タイムアウトが発生しました',
        description:
            '処理のタイムアウトが発生しました。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'timeout', // Changed for visual
    },
    {
        code: 525,
        name: 'SSL Handshake Failed',
        title: 'Cloudflare Error',
        message: 'SSLハンドシェイク失敗',
        description:
            'SSL/TLS通信の確立に失敗しました。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'security', // Changed for visual
    },
    {
        code: 526,
        name: 'Invalid SSL Certificate',
        title: 'Cloudflare Error',
        message: '無効なSSL証明書',
        description:
            '無効なSSL証明書です。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'security', // Changed for visual
    },
    {
        code: 527,
        name: 'Railgun Error',
        title: 'Cloudflare Error',
        message: 'Railgunエラー',
        description:
            'Railgunリスナーとの通信エラーが発生しました。しばらく時間を置いてから再度お試しください。',
        priority: 'C',
        designType: 'network', // Changed for visual
    },
];
