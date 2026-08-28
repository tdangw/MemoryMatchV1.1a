# Android build

## Debug APK

1. Cài Android SDK và tạo `android/local.properties` với đường dẫn `sdk.dir` cục bộ.
2. Chạy `npm run android:apk` từ thư mục gốc dự án.
3. APK cài thử được tạo tại `android/app/build/outputs/apk/debug/app-debug.apk`.

Lệnh này luôn build profile `android`, đồng bộ asset vào Capacitor và không đóng gói pháo hoa, confetti, cảnh hoa cũ hoặc nhạc riêng của cảnh hoa.

## Release APK

Thiết lập keystore ngoài Git theo mẫu `android/keystore.properties.example`, sau đó chạy `npm run android:apk:release`.
