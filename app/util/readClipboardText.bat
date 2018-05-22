// 2>nul||@goto :batch
/*
:batch
@echo off
setlocal

:: delete old exe
del %APPDATA%\LoLQ-userdata\%~n0.exe >nul 2>nul

:: find csc.exe
set "csc="
for /r "%SystemRoot%\Microsoft.NET\Framework\" %%# in ("*csc.exe") do  set "csc=%%#"

if not exist "%csc%" (
   exit /b 10
)

if not exist "%APPDATA%\LoLQ-userdata\%~n0.exe" (
   call %csc% /nologo /warn:0 /out:"%APPDATA%\LoLQ-userdata\%~n0.exe" "%~dpsfnx0" || (
      exit /b %errorlevel% 
   )
)

endlocal & exit /b %errorlevel%

*/

using System;
using System.Text;
using System.Windows.Forms;

public class user32 {
	[STAThread]
	static void Main(string[] args) {
		if (Clipboard.ContainsText(TextDataFormat.Text)) {
			string clipboardText = Clipboard.GetText(TextDataFormat.Text);
			Console.OutputEncoding = Encoding.UTF8;
			Console.Write(clipboardText);
		}
	}
}