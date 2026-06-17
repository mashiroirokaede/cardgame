# Googleログインとクラウド保存の設定

このゲームのクラウド保存は Firebase Authentication と Firestore を使います。
未設定のままでもゲームはローカル保存で動きます。

## 1. Firebaseプロジェクトを作る

Firebase Consoleで新しいプロジェクトを作ります。

```text
https://console.firebase.google.com/
```

## 2. Webアプリを追加する

プロジェクト概要で `</>` Webアプリを追加し、表示された `firebaseConfig` をコピーします。

## 3. firebase-config.js に貼る

`firebase-config.js` の空欄を、Firebase Consoleに表示された値で埋めます。

```js
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

この設定値は公開されても通常は問題ありません。
ただし、Firestoreのセキュリティルールは必ず設定してください。

## 4. Googleログインを有効化する

Firebase Consoleで `Authentication` → `Sign-in method` を開き、`Google` を有効化します。

## 5. 承認済みドメインを追加する

Authenticationの設定で、承認済みドメインにGitHub Pagesのドメインを追加します。

```text
mashiroirokaede.github.io
```

ローカルで試す場合は、必要に応じて次も入れます。

```text
localhost
127.0.0.1
```

## 6. Firestore Databaseを作る

`Firestore Database` を開き、データベースを作成します。最初は本番モードでOKです。

## 7. Firestoreルールを設定する

Firestoreの `Rules` に次を設定します。

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/saves/{saveId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

このルールで、自分のGoogleアカウントの保存データだけ読めるようになります。

## 8. GitHub Pagesへ反映する

1. `firebase-config.js` を更新
2. `sw.js` の `CACHE_NAME` を1つ上げる
3. GitHubへアップロード
4. GitHub ActionsのPagesデプロイが緑チェックになるまで待つ
5. ゲームURLを開く
6. メニューの `クラウド保存` からGoogleログイン

## 保存されるデータ

- 所持カード
- 作成カード
- 山札
- ガチャ玉
- カード創造チケット
- ガチャ履歴
- AI戦の途中データ

## 注意

初回ログイン時にクラウド側に既存データがある場合は、ゲーム内で次のどちらかを選びます。

- クラウドデータを読み込む
- この端末のデータをクラウドへ保存

一度選ぶと、その後は自動保存になります。

## よくあるエラー

### Failed to get document because the client is offline

ログインはできているがFirestoreから読めていない状態です。

確認すること:

1. GitHubに最新版の `app.js` と `sw.js` をアップロードしている
2. `sw.js` の `CACHE_NAME` が上がっている
3. スマホで `https://mashiroirokaede.github.io/cardgame/index.html?v=26` のように開き直す
4. Firebase Consoleで `Firestore Database` が作成済み
5. FirestoreのRulesが設定済み

それでも続く場合は、ゲーム側のFirestore通信方式をスマホ向けに調整している最新版が反映されていない可能性が高いです。
