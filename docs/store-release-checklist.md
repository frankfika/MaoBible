# 商店发布检查清单

## 硬门槛

- [ ] 确认上架主体：个人或组织；记录 Apple Team ID 与 Play Console 开发者名称。
- [ ] 获得中文文本公开分发的书面授权或正式法律意见。
- [ ] 英文稿完成逐篇人工校对；不得分发来源或权利不明的外文出版社文本。
- [ ] 修复 [`content-release-audit.md`](content-release-audit.md) 中记录的 18 篇英文稿重复、空白和错位问题。
- [ ] 填写公开支持邮箱、运营主体和隐私联系人。
- [ ] 将 `/privacy` 部署到长期稳定的 HTTPS 公网地址。
- [ ] 若在中国大陆提供互联网信息服务，完成所需 APP 备案；如被认定属于出版类服务，取得相应主管部门文件。

## Android / Google Play

- [x] 包名固定为 `com.frankfika.maobible`。
- [x] `targetSdkVersion` 为 36。
- [x] 图标、启动页、原生分享和触感反馈已接入。
- [x] Debug APK、单元测试与 Android Lint 通过。
- [ ] 创建 Google Play 应用记录并完成开发者身份验证。
- [x] 创建 upload key，并建立权限受限的本机备份；首次上传前仍须复制到加密的密码管理器或离线介质。
- [x] 创建本机 `android/keystore.properties` 并确认密钥、密码均被 Git 忽略。
- [ ] 每次发布递增 `versionCode`，更新 `versionName`。
- [x] 运行 `pnpm mobile:android:bundle`，生成并验证签名 `app-release.aab`。
- [ ] 在全部内容与合规门槛通过后，将 AAB 上传至 Play Console 内部测试轨道。
- [ ] 完成 Data safety、内容分级、目标受众、广告和 AI 内容声明。
- [ ] 上传 512×512 图标、1024×500 feature graphic 与手机截图。
- [ ] 新个人账号按 Play Console 要求完成封闭测试后申请正式发布权限。

## iOS / App Store

- [x] Bundle ID 固定为 `com.frankfika.maobible`。
- [x] 原生工程、应用图标、启动页和 Capacitor 插件已生成。
- [ ] 安装完整 Xcode 并选择 Apple Developer Team。
- [ ] 在真机和至少一台当前 iPhone 模拟器上完成阅读、分享、离线和深色模式测试。
- [ ] 在 App Store Connect 创建应用记录并上传 Archive。
- [ ] 填写 App Privacy、年龄分级、内容权利和审核备注。
- [ ] 上传 iPhone / iPad 截图、描述、关键词、支持网址与隐私政策网址。

## 发布前回归

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Android：`testDebugUnitTest lintDebug assembleDebug`
- [ ] Android：验证签名 AAB 的包名、版本、证书和目标 API。
- [ ] iOS：Archive validation 无错误，TestFlight 安装通过。
- [ ] 全新安装、升级安装、离线启动、书签与进度持久化均通过。
