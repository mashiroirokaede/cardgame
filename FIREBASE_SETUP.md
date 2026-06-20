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
    function signedIn() {
      return request.auth != null;
    }

    function isRoomPlayer(data) {
      return signedIn()
        && data.players is list
        && data.players.size() > 0
        && (
          data.players[0].uid == request.auth.uid
          || (
            data.players.size() > 1
            && data.players[1] != null
            && data.players[1].uid == request.auth.uid
          )
        );
    }

    function isJoiningOpenRoom() {
      return signedIn()
        && resource.data.players is list
        && resource.data.players.size() > 1
        && resource.data.players[1] == null
        && request.resource.data.players[1].uid == request.auth.uid;
    }

    match /users/{userId}/saves/{saveId} {
      allow read, write: if signedIn() && request.auth.uid == userId;
    }

    match /rooms/{roomId} {
      allow create: if signedIn() && request.resource.data.players[0].uid == request.auth.uid;
      allow read: if signedIn();
      allow update: if isRoomPlayer(resource.data) || isJoiningOpenRoom();
      allow delete: if isRoomPlayer(resource.data);
    }

    match /auctions/{auctionId} {
      allow read, create, update: if signedIn();
      allow delete: if false;
    }
  }
}
```

このルールで、自分のGoogleアカウントの保存データだけ読めるようになります。
オンライン対戦の部屋は、ログイン済みユーザーが部屋IDで読み込み、参加者だけが更新できます。
オークションはMVP版のため、ログイン済みユーザーが共有出品に入札・落札更新できます。
ユーザー出品も `auctions` コレクションに保存されます。出品中のカードは端末の所持数から1枚減ります。
入札に成功すると、その場で入札額分のゴールドを預かり金として消費します。別の人に最高入札を更新された場合は、対象オークションの「返金を受け取る」からゴールドを戻せます。
落札者が受け取りを完了すると、出品者が売上を受け取れるようになります。落札後24時間を過ぎた場合は、出品者が期限切れ処理をしてカードを戻し、落札者には預かり金の返金枠を残せます。

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
- 山札、複数デッキ、選択中デッキ
- ゲーム内プレイヤー名
- デイリーミッション進行状況
- カード強化・進化データ
- ガチャ玉
- カード創造チケット
- ガチャ履歴
- AI戦の途中データ
- オンライン対戦の部屋データ、同期revision
- オークションの入札・ユーザー出品・返金・売上受け取りデータ

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
3. スマホで `https://mashiroirokaede.github.io/cardgame/index.html?v=46` のように開き直す
4. Firebase Consoleで `Firestore Database` が作成済み
5. FirestoreのRulesが設定済み

それでも続く場合は、ゲーム側のFirestore通信方式をスマホ向けに調整している最新版が反映されていない可能性が高いです。
