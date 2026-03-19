@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21.0.10
set ANDROID_HOME=C:\Users\taki allah\AppData\Local\Android\Sdk
set PATH=%PATH%;C:\Program Files\Java\jdk-21.0.10\bin
cd android
echo Starting Gradle build...
gradlew.bat assembleDebug
echo.
echo Build complete! Check android\app\build\outputs\apk\debug\
dir android\app\build\outputs\apk\debug\ 2>nul
pause
