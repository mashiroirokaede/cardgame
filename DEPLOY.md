# スマホ単体で遊べるように公開する手順

PCを閉じてもスマホで遊ぶには、PCのローカルサーバーではなく、HTTPSで公開されたURLに置く必要があります。
このゲームはHTML/CSS/JavaScriptだけで動くので、作成途中はGitHub Pagesが一番更新しやすいです。

## おすすめ: GitHub Pages

1. GitHubで新しいリポジトリを作る
2. このフォルダの中身を全部アップロードする
   - `index.html`
   - `styles.css`
   - `app.js`
   - `sw.js`
   - `manifest.webmanifest`
   - `icon.svg`
   - `.nojekyll`
   - `assets/`
3. GitHubのリポジトリ画面で `Settings` → `Pages` を開く
4. `Build and deployment` を `Deploy from a branch` にする
5. Branchを `main`、folderを `/root` にして保存する
6. 表示されたURLをスマホで開く

公開URLはだいたい次の形になります。

```text
https://ユーザー名.github.io/リポジトリ名/
```

## スマホでアプリっぽく使う

公開URLをスマホで開いたあと、ブラウザのメニューからホーム画面に追加します。

- iPhone Safari: 共有ボタン → ホーム画面に追加
- Android Chrome: メニュー → ホーム画面に追加、またはアプリをインストール

一度読み込むと、AI戦やローカル対戦はオフラインでも起動できます。
ただし、初回読み込みと更新反映にはインターネット接続が必要です。

## 更新を簡単にする流れ

作成途中は次の流れが楽です。

1. Codexでファイルを修正する
2. `sw.js` の `CACHE_NAME` を1つ上げる
3. GitHub Desktopなどで変更をcommit/pushする
4. 1分ほど待ってスマホでページを再読み込みする

`CACHE_NAME` を上げると、スマホに古いJavaScriptやCSSが残りにくくなります。
Codexに更新を頼んだ時は、基本的にこちらも一緒に更新します。

## 注意

今の保存データは `localStorage` なので、スマホ本体のブラウザ内に保存されます。
PCとスマホで所持カードやデッキは共有されません。
将来的にアカウント共有やオンライン対戦を入れる場合は、Firebase Firestoreに保存する形へ移行するのがよいです。
