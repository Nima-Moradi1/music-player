# Dependency compatibility

Verified against published manifests and official documentation on 2026-09-29. The lockfile pins the complete graph.

| Package               | Version         | Evidence                                                                                                                                                          |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native / React  | 0.87.1 / 19.2.3 | [RN releases](https://github.com/facebook/react-native/releases); npm peer range                                                                                  |
| Gesture Handler       | 3.3.0           | [Official installation](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation/)                                                  |
| Reanimated / Worklets | 4.7.0 / 0.13.0  | [Compatibility matrix](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/): RN 0.86–0.88, Worklets 0.13                                |
| Skia                  | 2.13.0          | Published peers: React ≥19, RN ≥0.78, Reanimated ≥4                                                                                                               |
| MMKV / Nitro          | 4.3.2 / 0.37.1  | [MMKV v4](https://github.com/margelo/react-native-mmkv); requires Nitro                                                                                           |
| SQLite                | 18.2.5          | [OP-SQLite](https://op-engineering.github.io/op-sqlite/docs/installation/) upstream example/package.json uses RN 0.87.0 / React 19.2.3; native build gate remains |

pnpm uses hoisted modules. Metro watches the workspace root; Android Gradle paths resolve root `node_modules`. CocoaPods resolves React Native through Node. Permissive peer ranges do not certify native compatibility: builds and device smoke are mandatory.
